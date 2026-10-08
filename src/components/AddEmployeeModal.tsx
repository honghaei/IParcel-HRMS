import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Modal, Toast, ToastContainer } from 'react-bootstrap'
import axios from 'axios'
import { FaCamera, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import '../styles/AddEmployeeModal.css'
import { API_BASE_URL, employeeImageUrl } from '../config/api'
import type { Department, Employee } from '../types/hr'

type Props = {
  show: boolean
  onClose: () => void
  onAdd: () => void
  employeeToEdit?: Employee | null
}

type FormData = {
  firstName: string
  middleName: string
  lastName: string
  employeeNumber: string
  designation: string
  employmentStatus: string
  company: string
  department: string
  provincialAddress: string
  homeAddress: string
  location: string
  yearsOfService: string
  maritalStatus: string
  dateHired: string
  childrenCount: string
  birthplace: string
  birthdate: string
  contactNumber: string
  payRate: string
  sss: string
  pagibig: string
  philhealth: string
  tin: string
  paymentBasis: string
  email: string
  emergencyContactPerson: string
  emergencyRelationship: string
  emergencyContactNumber: string
  emergencyAddress: string
  profile_picture: string
}

const blank:FormData={
  firstName:'',middleName:'',lastName:'',employeeNumber:'',designation:'',employmentStatus:'',company:'',department:'',
  provincialAddress:'',homeAddress:'',location:'',yearsOfService:'',maritalStatus:'',dateHired:'',childrenCount:'',
  birthplace:'',birthdate:'',contactNumber:'',payRate:'',sss:'',pagibig:'',philhealth:'',tin:'',paymentBasis:'',email:'',
  emergencyContactPerson:'',emergencyRelationship:'',emergencyContactNumber:'',emergencyAddress:'',profile_picture:''
}

const companyOptions:Record<string,{label:string;designations:string[];locations:string[]}>= {
  'iparcel plus':{
    label:'IParcel Plus',
    designations:['Retail Shipping Officer','Retail Area Supervisor','Retail Operations Manager','Admin/Liason Officer','Admin/Purchasing Officer','Admin/IT Officer','Admin/IT Support Staff','Admin Rider','Corporate Support Officer','Corporate Support Supervisor','Human Resource Manager','Human Resource Assistant','Admin Manager','Accounting Assistant','Accounting Supervisor','Finance Manager','Marketing Head','Chief Financial Officer','Marketing Communications Supervisor','E-Sales Officer','Chief Operating Officer'],
    locations:['DM','PANAY','GATEWAY','ALIMALL','FARMERS','EVERCOM','ETON','CLOVER','CYBER','CVTCEN','CVTROS','CVTTRE','CVTSER','CVTBAC','CEBPARK','CEBCNTY','CEBEMALL','CEBITPARK','CEBJMALL','HO']
  },
  ipxpress:{
    label:'IPXpress',
    designations:['Customer Service Agent','President','Retail Area Supervisor','Admin/Liason Officer','Admin/Purchasing Officer','Admin/IT Officer','Admin/IT Support Staff','Admin Rider','Corporate Support Officer','Corporate Support Supervisor','Human Resource Manager','Human Resource Assistant','Admin Manager','Accounting Assistant','Accounting Supervisor','Finance Manager','Marketing Head','Chief Financial Officer','Marketing Communications Supervisor','E-Sales Officer','Chief Operating Officer'],
    locations:['QAVE','LERMA','DELTA','STALUCIA','FELIZ','GRNFLD','ROBNOVA','RUFINO','PMPLNA','SMBF','TUTUBAN','BAGABAN','LPBGBEN','CVTIMUS','CEBRAM','CEBLAP','DVODTU']
  },
  swift:{
    label:'Swift',
    designations:['Swift Operations Manager','Delivery Driver','Motorized Rider','Domestic Shipping Coordinator','Admin/Accounting Assistant'],
    locations:['STA.CATALINA']
  },
  nagali:{
    label:'Nagali',
    designations:['Property Administrator'],
    locations:['HO','JUNQUERA']
  }
}

const tabs=['Personal','Employment','Government & Pay','Emergency'] as const
type Tab=typeof tabs[number]

function normalize(value:string){
  return value.trim().toLowerCase()
}

function yearsOfService(dateHired:string){
  if(!dateHired) return ''
  const hired=new Date(`${dateHired}T00:00:00`)
  const now=new Date()
  let years=now.getFullYear()-hired.getFullYear()
  if(now.getMonth()<hired.getMonth()||(now.getMonth()===hired.getMonth()&&now.getDate()<hired.getDate())) years--
  return Math.max(0,years).toString()
}

function fromEmployee(employee:Employee):FormData{
  return {
    firstName:employee.first_name||'',
    middleName:employee.middle_name||'',
    lastName:employee.last_name||'',
    employeeNumber:employee.employee_number||'',
    designation:employee.designation||'',
    employmentStatus:employee.employment_status||'',
    company:normalize(employee.company||''),
    department:employee.department||'',
    provincialAddress:employee.provincial_address||'',
    homeAddress:employee.home_address||'',
    location:employee.location||'',
    yearsOfService:yearsOfService(employee.date_hired),
    maritalStatus:employee.marital_status||'',
    dateHired:employee.date_hired||'',
    childrenCount:employee.children_count||'',
    birthplace:employee.birthplace||'',
    birthdate:employee.birthdate||'',
    contactNumber:employee.contact_number||'',
    payRate:employee.pay_rate||'',
    sss:employee.sss||'',
    pagibig:employee.pagibig||'',
    philhealth:employee.philhealth||'',
    tin:employee.tin||'',
    paymentBasis:employee.payment_basis||'',
    email:employee.email||'',
    emergencyContactPerson:employee.emergency_contact_person||'',
    emergencyRelationship:employee.emergency_relationship||'',
    emergencyContactNumber:employee.emergency_contact_number||'',
    emergencyAddress:employee.emergency_address||'',
    profile_picture:employee.profile_picture||''
  }
}

export default function AddEmployeeModal({show,onClose,onAdd,employeeToEdit}:Props){
  const [formData,setFormData]=useState<FormData>(blank)
  const [departments,setDepartments]=useState<Department[]>([])
  const [photoFile,setPhotoFile]=useState<File|null>(null)
  const [photoPreview,setPhotoPreview]=useState<string|null>(null)
  const [showToast,setShowToast]=useState(false)
  const [zoom,setZoom]=useState(false)
  const [tab,setTab]=useState<Tab>('Personal')
  const [submitting,setSubmitting]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{
    if(employeeToEdit){
      const next=fromEmployee(employeeToEdit)
      setFormData(next)
      setPhotoPreview(next.profile_picture?employeeImageUrl(next.profile_picture):null)
    }else{
      setFormData(blank)
      setPhotoPreview(null)
    }
    setPhotoFile(null)
    setTab('Personal')
    setError('')
  },[employeeToEdit,show])

  useEffect(()=>{
    if(!show) return
    axios.get<Department[]>(`${API_BASE_URL}/get_departments.php`)
      .then(response=>setDepartments(response.data))
      .catch(()=>{
        // The employee form remains usable even if the Departments module is unavailable.
        setDepartments([])
      })
  },[show])

  const companyKey=normalize(formData.company)
  const company=companyOptions[companyKey]

  const departmentOptions=useMemo(()=>{
    const fromApi=departments
      .filter(department=>normalize(department.company)===companyKey)
      .map(department=>department.name)

    if(fromApi.length) return Array.from(new Set(fromApi)).sort()

    return ['Admin/HR','Marketing','Corporate Support','Accounting','Operations']
  },[departments,companyKey])

  const initials=useMemo(
    ()=>`${formData.firstName[0]||''}${formData.lastName[0]||''}`.toUpperCase(),
    [formData.firstName,formData.lastName]
  )

  const activeTab=tabs.indexOf(tab)

  const change=(name:keyof FormData,value:string)=>{
    setError('')
    setFormData(current=>{
      const next={...current,[name]:value}

      if(name==='dateHired'){
        next.yearsOfService=yearsOfService(value)
      }

      if(name==='company'){
        next.company=normalize(value)
        next.designation=''
        next.location=''
        next.department=''
      }

      return next
    })
  }

  const handleFileChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]
    if(!file) return

    if(file.size>5*1024*1024){
      setError('Employee photo must be 5 MB or smaller.')
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  const uploadPhoto=async()=>{
    if(!photoFile) return formData.profile_picture||null

    const body=new FormData()
    body.append('photo',photoFile)
    body.append('fullName',`${formData.firstName} ${formData.lastName}`.trim())

    const response=await axios.post(`${API_BASE_URL}/upload_photo.php`,body)

    if(!response.data?.success){
      throw new Error(response.data?.error||'Photo upload failed.')
    }

    return response.data.filename as string
  }

  const validateTab=(target:Tab)=>{
    if(target==='Personal'){
      if(!formData.firstName.trim()||!formData.lastName.trim()){
        return 'First name and last name are required before continuing.'
      }

      if(formData.email&& !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)){
        return 'Enter a valid email address.'
      }

      return ''
    }

    if(target==='Employment'){
      if(!formData.employeeNumber.trim()){
        return 'Employee number is required.'
      }
      if(!formData.company){
        return 'Select a company.'
      }
      if(!formData.department){
        return 'Select a department.'
      }
      if(!formData.designation){
        return 'Select a designation.'
      }
      if(!formData.employmentStatus){
        return 'Select an employment status.'
      }
      if(!formData.location){
        return 'Select a location.'
      }
      if(!formData.dateHired){
        return 'Date hired is required.'
      }
      return ''
    }

    if(target==='Government & Pay'){
      if(formData.payRate&&Number(formData.payRate)<0){
        return 'Pay rate cannot be negative.'
      }
      return ''
    }

    return ''
  }

  const validateAll=()=>{
    for(const target of tabs){
      const message=validateTab(target)
      if(message){
        setTab(target)
        return message
      }
    }
    return ''
  }

  const goNext=()=>{
    const validation=validateTab(tab)
    if(validation){
      setError(validation)
      return
    }

    setError('')
    setTab(tabs[activeTab+1])
  }

  const handleSubmit=async()=>{
    const validation=validateAll()
    if(validation){
      setError(validation)
      return
    }

    setSubmitting(true)
    setError('')

    try{
      const uploaded=await uploadPhoto()

      const payload={
        ...formData,
        company:companyKey,
        yearsOfService:yearsOfService(formData.dateHired),
        profile_picture:uploaded,
        id:employeeToEdit?.id
      }

      const endpoint=employeeToEdit?'update_employee.php':'add_employee.php'
      const response=await axios.post(`${API_BASE_URL}/${endpoint}`,payload)

      if(response.data?.success===false){
        throw new Error(response.data?.message||response.data?.error||'Unable to save employee.')
      }

      setShowToast(true)
      onAdd()
      onClose()
    }catch(err){
      console.error(err)
      setError(err instanceof Error?err.message:'Unable to save employee.')
    }finally{
      setSubmitting(false)
    }
  }

  const label=(text:string,required=false)=>
    <>{text}{required&&<span className="required-star">*</span>}</>

  const input=(
    text:string,
    name:keyof FormData,
    type='text',
    disabled=false,
    required=false
  )=>
    <Form.Group className="field-group">
      <Form.Label>{label(text,required)}</Form.Label>
      <Form.Control
        name={name}
        value={formData[name]}
        onChange={e=>change(name,e.target.value)}
        type={type}
        disabled={disabled}
      />
    </Form.Group>

  const select=(
    text:string,
    name:keyof FormData,
    options:{value:string;label:string}[]|string[],
    disabled=false,
    required=false
  )=>
    <Form.Group className="field-group">
      <Form.Label>{label(text,required)}</Form.Label>
      <Form.Select
        name={name}
        value={formData[name]}
        onChange={e=>change(name,e.target.value)}
        disabled={disabled}
      >
        <option value="">Select {text}</option>
        {options.map(option=>{
          const value=typeof option==='string'?option:option.value
          const optionLabel=typeof option==='string'?option:option.label
          return <option key={value} value={value}>{optionLabel}</option>
        })}
      </Form.Select>
    </Form.Group>

  const companySelectOptions=Object.entries(companyOptions).map(([value,data])=>({
    value,
    label:data.label
  }))

  return <>
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      backdrop="static"
      centered
      dialogClassName="employee-modal-dialog"
    >
      <div className="employee-modal-header">
        <div>
          <span className="eyebrow">EMPLOYEE RECORD</span>
          <h2>{employeeToEdit?'Edit Employee':'Add Employee'}</h2>
          <small>Fields marked <b>*</b> are required.</small>
        </div>
        <button type="button" onClick={onClose}>×</button>
      </div>

      <div className="employee-modal-tabs">
        {tabs.map((name,index)=>
          <button
            key={name}
            className={tab===name?'active':''}
            onClick={()=>{
              if(index<=activeTab){
                setTab(name)
                setError('')
                return
              }

              const validation=validateTab(tab)
              if(validation){
                setError(validation)
                return
              }

              setTab(name)
              setError('')
            }}
          >
            <span>{index+1}</span>{name}
          </button>
        )}
      </div>

      <Modal.Body className="employee-modal-body">
        <div className="employee-modal-layout">
          <aside className="employee-photo-column">
            <button
              className="employee-photo"
              type="button"
              onClick={()=>photoPreview&&setZoom(true)}
            >
              {photoPreview
                ? <img src={photoPreview} alt="Employee preview"/>
                : <span>{initials||<FaCamera/>}</span>
              }
            </button>

            <label className="upload-photo-btn">
              Upload photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
            </label>

            <small className="photo-helper">JPG, PNG or WebP · max 5 MB</small>

            <strong>
              {`${formData.firstName} ${formData.lastName}`.trim()||'New Employee'}
            </strong>
            <small>{formData.employeeNumber||'Employee number'}</small>

            {(formData.company||formData.employmentStatus)&&(
              <div className="employee-modal-summary-tags">
                {formData.company&&<span>{companyOptions[companyKey]?.label||formData.company}</span>}
                {formData.employmentStatus&&<span>{formData.employmentStatus}</span>}
              </div>
            )}
          </aside>

          <section className="employee-form-content">
            {error&&<div className="modal-error">{error}</div>}

            {tab==='Personal'&&<>
              <div className="form-section-intro">
                <strong>Personal Information</strong>
                <span>Basic employee identity and contact details.</span>
              </div>

              <div className="form-section-grid">
                {input('First Name','firstName','text',false,true)}
                {input('Middle Name','middleName')}
                {input('Last Name','lastName','text',false,true)}
                {input('Birthdate','birthdate','date')}
                {input('Birthplace','birthplace')}
                {select('Marital Status','maritalStatus',['Single','Married','Widowed','Solo Parent'])}
                {input('No. of Children','childrenCount','number')}
                {input('Email Address','email','email')}
                {input('Contact No.','contactNumber')}
                <div className="span-3">{input('Home Address','homeAddress')}</div>
                <div className="span-3">{input('Provincial Address','provincialAddress')}</div>
              </div>
            </>}

            {tab==='Employment'&&<>
              <div className="form-section-intro">
                <strong>Employment Details</strong>
                <span>Company assignment, position, employment status, and tenure.</span>
              </div>

              <div className="form-section-grid">
                {input('Employee Number','employeeNumber','text',false,true)}
                {select('Company','company',companySelectOptions,false,true)}
                {select('Department','department',departmentOptions,!companyKey,true)}
                {select('Designation','designation',company?.designations||[],!company,true)}
                {select('Employment Status','employmentStatus',['Probationary','Regular','Resigned','Terminated'],false,true)}
                {select('Location','location',company?.locations||[],!company,true)}
                {input('Date Hired','dateHired','date',false,true)}
                {input('Years of Service','yearsOfService','text',true)}
              </div>
            </>}

            {tab==='Government & Pay'&&<>
              <div className="form-section-intro">
                <strong>Government & Pay</strong>
                <span>Government identifiers and compensation information.</span>
              </div>

              <div className="form-section-grid">
                {input('SSS No.','sss')}
                {input('Pag-IBIG No.','pagibig')}
                {input('PhilHealth No.','philhealth')}
                {input('TIN','tin')}
                {select('Payment Basis','paymentBasis',['Daily','Monthly'])}
                {input('Pay Rate','payRate','number')}
              </div>
            </>}

            {tab==='Emergency'&&<>
              <div className="form-section-intro">
                <strong>Emergency Contact</strong>
                <span>Person to contact in case of an employee emergency.</span>
              </div>

              <div className="form-section-grid">
                {input('Contact Person','emergencyContactPerson')}
                {input('Relationship','emergencyRelationship')}
                {input('Contact No.','emergencyContactNumber')}
                <div className="span-3">{input('Emergency Address','emergencyAddress')}</div>
              </div>
            </>}
          </section>
        </div>
      </Modal.Body>

      <Modal.Footer className="employee-modal-footer">
        <span>Step {activeTab+1} of {tabs.length}</span>

        <div>
          {activeTab>0&&(
            <Button variant="light" onClick={()=>{setError('');setTab(tabs[activeTab-1])}}>
              <FaChevronLeft/> Previous
            </Button>
          )}

          {activeTab<tabs.length-1
            ? <Button variant="primary" onClick={goNext}>Next <FaChevronRight/></Button>
            : <Button variant="primary" disabled={submitting} onClick={handleSubmit}>
                {submitting?'Saving…':employeeToEdit?'Update Employee':'Add Employee'}
              </Button>
          }
        </div>
      </Modal.Footer>
    </Modal>

    <ToastContainer position="top-end" className="p-3">
      <Toast show={showToast} onClose={()=>setShowToast(false)} delay={2600} autohide bg="success">
        <Toast.Header><strong className="me-auto">Success</strong></Toast.Header>
        <Toast.Body className="text-white">
          Employee {employeeToEdit?'updated':'added'} successfully.
        </Toast.Body>
      </Toast>
    </ToastContainer>

    <Modal show={zoom} onHide={()=>setZoom(false)} centered size="lg">
      <Modal.Header closeButton/>
      <Modal.Body className="photo-zoom-body">
        {photoPreview&&<img src={photoPreview} alt="Employee"/>}
      </Modal.Body>
    </Modal>
  </>
}
