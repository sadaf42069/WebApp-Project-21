export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function text(value, field, { required = true, fallback = '' } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required.`)
    return fallback
  }
  return String(value).trim()
}

function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be one of: ${allowed.join(', ')}.`)
  }
  return value
}

function amount(value, field) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a non-negative number.`)
  }
  return parsed
}

export function validateCredentials(body = {}) {
  const email = text(body.email, 'Email').toLowerCase()
  const password = text(body.password, 'Password')
  if (!email.includes('@')) throw new HttpError(400, 'VALIDATION_ERROR', 'Enter a valid email address.')
  return { email, password }
}

export function validateShop(body = {}) {
  return {
    no: text(body.no, 'Shop number').toUpperCase(),
    name: text(body.name, 'Shop name'),
    category: text(body.category, 'Category', { required: false, fallback: 'General' }),
    size: amount(body.size, 'Size'),
    floor: text(body.floor, 'Floor'),
    status: oneOf(body.status, 'Status', ['Occupied', 'Vacant']),
    contact: text(body.contact, 'Contact', { required: false, fallback: 'Management Office' }),
    openingHours: text(body.openingHours, 'Opening hours', { required: false, fallback: 'By appointment' }),
    description: text(body.description, 'Description', { required: false, fallback: 'No description added yet.' }),
  }
}

export function validateTenant(body = {}) {
  return {
    id: text(body.id, 'Tenant ID').toUpperCase(),
    name: text(body.name, 'Tenant name'),
    shopNo: text(body.shopNo, 'Shop number').toUpperCase(),
    rent: amount(body.rent, 'Rent'),
    dueDate: text(body.dueDate, 'Due date'),
    paymentStatus: oneOf(body.paymentStatus, 'Payment status', ['Paid', 'Due', 'Overdue']),
    phone: text(body.phone, 'Phone'),
    businessCategory: text(body.businessCategory, 'Business category'),
    startDate: text(body.startDate, 'Start date'),
  }
}

export function validatePaymentStatus(body = {}) {
  return oneOf(body.paymentStatus, 'Payment status', ['Paid', 'Due', 'Overdue'])
}

