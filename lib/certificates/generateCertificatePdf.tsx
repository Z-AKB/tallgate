import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { siteConfig } from '@/lib/config/site'

export interface CertificateData {
  recipient_name: string
  course_title: string
  issue_date: string
  grade: string | null
  certificate_number: string
  verification_code: string
  verification_url: string
  qr_data_url: string
  logo_src?: string
}

const NAVY = '#061A4F'
const NAVY_DEEP = '#040F35'
const INDIGO = '#1C5BDD'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  frame: {
    flex: 1,
    borderWidth: 2,
    borderColor: INDIGO,
    padding: 28,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  legalName: {
    fontSize: 9,
    letterSpacing: 2,
    color: NAVY,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
    textAlign: 'center',
    color: NAVY_DEEP,
  },
  rule: {
    width: 90,
    height: 2,
    backgroundColor: INDIGO,
    marginBottom: 14,
  },
  body: {
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    color: '#334155',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
    color: NAVY_DEEP,
  },
  course: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
    color: NAVY,
  },
  details: {
    fontSize: 9,
    marginTop: 14,
    textAlign: 'center',
    color: '#475569',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureSection: {
    alignItems: 'center',
    width: '30%',
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    width: '100%',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#475569',
  },
  qrSection: {
    alignItems: 'center',
    width: '25%',
  },
  qr: {
    width: 78,
    height: 78,
  },
  qrCaption: {
    fontSize: 7,
    marginTop: 5,
    textAlign: 'center',
    color: '#475569',
  },
  verificationCode: {
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
    color: NAVY,
  },
  legal: {
    fontSize: 7,
    marginTop: 12,
    textAlign: 'center',
    color: '#94A3B8',
  },
})

export function CertificateDocument({
  data,
}: {
  data: CertificateData
}): ReactElement {
  return (
    <Document
      title={`${siteConfig.companyName} Certificate ${data.certificate_number}`}
      author={siteConfig.companyName}
      subject={data.course_title}
      keywords={`certificate,${data.verification_code},${data.certificate_number}`}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.header}>
            {data.logo_src ? <PdfImage src={data.logo_src} style={styles.logo} /> : null}
            <Text style={styles.legalName}>{siteConfig.companyName.toUpperCase()}</Text>
            <Text style={styles.title}>Certificate of Completion</Text>
            <View style={styles.rule} />
          </View>

          <View style={styles.body}>
            <Text style={styles.text}>This is to certify that</Text>
            <Text style={styles.name}>{data.recipient_name}</Text>
            <Text style={styles.text}>has successfully completed the programme</Text>
            <Text style={styles.course}>{data.course_title}</Text>
            {data.grade ? (
              <Text style={styles.text}>awarded with the standing of {data.grade}</Text>
            ) : null}
            <Text style={styles.text}>on {formatIssueDate(data.issue_date)}</Text>
            <Text style={styles.details}>
              Certificate Number: {data.certificate_number}
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.signatureSection}>
              <View style={styles.line} />
              <Text style={styles.signatureLabel}>Training Coordinator</Text>
            </View>

            <View style={styles.qrSection}>
              <PdfImage src={data.qr_data_url} style={styles.qr} />
              <Text style={styles.qrCaption}>Scan to verify this certificate</Text>
              <Text style={styles.verificationCode}>{data.verification_code}</Text>
            </View>

            <View style={styles.signatureSection}>
              <View style={styles.line} />
              <Text style={styles.signatureLabel}>Programme Director</Text>
            </View>
          </View>

          <Text style={styles.legal}>{siteConfig.tagline}</Text>
          <Text style={styles.legal}>
            Verify at {data.verification_url}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function formatIssueDate(issueDate: string) {
  const parsed = new Date(`${issueDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return issueDate
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} />)
}