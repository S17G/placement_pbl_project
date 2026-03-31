export const PLACEMENT_RECORDS_KEY = 'pmPlacementRecords'
export const REGISTRATION_REQUESTS_KEY = 'pmRegistrationRequests'

const placementSeed = [
  {
    id: 1,
    company: 'Accenture',
    role: 'Associate Software Engineer',
    package: '4.5 LPA',
    eligibility: 'CGPA 6.5+',
    process: 'Aptitude, Coding, Interview',
  },
  {
    id: 2,
    company: 'Capgemini',
    role: 'Analyst',
    package: '5.0 LPA',
    eligibility: 'CGPA 7.0+',
    process: 'Aptitude, Technical, HR',
  },
]

function parseJson(rawValue, fallbackValue) {
  try {
    const parsedValue = JSON.parse(rawValue)
    return parsedValue ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

export function getPlacementRecords() {
  const rawValue = localStorage.getItem(PLACEMENT_RECORDS_KEY)

  if (!rawValue) {
    localStorage.setItem(PLACEMENT_RECORDS_KEY, JSON.stringify(placementSeed))
    return [...placementSeed]
  }

  const parsedValue = parseJson(rawValue, placementSeed)
  if (!Array.isArray(parsedValue)) {
    localStorage.setItem(PLACEMENT_RECORDS_KEY, JSON.stringify(placementSeed))
    return [...placementSeed]
  }

  return parsedValue
}

export function savePlacementRecords(records) {
  localStorage.setItem(PLACEMENT_RECORDS_KEY, JSON.stringify(records))
}

export function getRegistrationRequests() {
  const rawValue = localStorage.getItem(REGISTRATION_REQUESTS_KEY)

  if (!rawValue) {
    return []
  }

  const parsedValue = parseJson(rawValue, [])
  return Array.isArray(parsedValue) ? parsedValue : []
}

export function saveRegistrationRequests(requests) {
  localStorage.setItem(REGISTRATION_REQUESTS_KEY, JSON.stringify(requests))
}
