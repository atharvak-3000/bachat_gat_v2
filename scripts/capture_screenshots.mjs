import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'
import { SignJWT } from 'jose'

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const screenshotsDir = path.resolve('docs', 'screenshots')

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

const BASE_URL = 'https://bachat-gat-online.vercel.app'
const DOMAIN = 'bachat-gat-online.vercel.app'

const JWT_SECRET_BYTES = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-super-secret-jwt-key-bachatgat-2026'
)

async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET_BYTES)
}

async function run() {
  console.log('🌐 Launching Microsoft Edge via puppeteer-core...')
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // 01. Landing Page
  try {
    console.log('📸 01: Landing Page...')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.screenshot({ path: path.join(screenshotsDir, '01_landing_page.png') })
  } catch (e) { console.error('Error 01:', e.message) }

  // 02. Onboarding Form
  try {
    console.log('📸 02: Onboarding Form...')
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.screenshot({ path: path.join(screenshotsDir, '02_onboarding_form.png') })
  } catch (e) { console.error('Error 02:', e.message) }

  // 05. Member Join Page
  try {
    console.log('📸 05: Member Join Page...')
    await page.goto(`${BASE_URL}/join`, { waitUntil: 'networkidle2', timeout: 30000 })
    const codeInput = await page.$('input')
    if (codeInput) {
      await codeInput.type('TEJAS1')
      await new Promise(r => setTimeout(r, 1200))
    }
    await page.screenshot({ path: path.join(screenshotsDir, '05_member_join_page.png') })
  } catch (e) { console.error('Error 05:', e.message) }

  // Admin Auth Cookie
  const adminToken = await createToken({
    memberId: '8ed4bae3-18ac-41df-9120-d0397ffcd6c2',
    organizationId: 'f15339a7-1d5a-4007-9650-17798841d665',
    role: 'SUPERADMIN'
  })

  await page.setCookie({
    name: 'bb_token',
    value: adminToken,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true
  })

  // 10: Meetings Dashboard (with Closing Date column)
  try {
    console.log('📸 10: Meetings Dashboard with Closing Date...')
    await page.goto(`${BASE_URL}/meetings`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(screenshotsDir, '10_meetings_dashboard_closing_date.png') })

    // 07 / 08: Open New Meeting Modal
    console.log('📸 07/08: New Meeting Modal...')
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('सभा') || b.textContent.includes('Meeting'))
      if (btn) btn.click()
    })
    await new Promise(r => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(screenshotsDir, '07_new_meeting_modal_autofetch.png') })
    await page.screenshot({ path: path.join(screenshotsDir, '08_draft_meeting_lock_alert.png') })
  } catch (e) { console.error('Error 10/07/08:', e.message) }

  // 04: Admin Members Page
  try {
    console.log('📸 04: Members Management...')
    await page.goto(`${BASE_URL}/members`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(screenshotsDir, '04_admin_add_member_modal.png') })
  } catch (e) { console.error('Error 04:', e.message) }

  // 06: KYC Verification Screen
  try {
    console.log('📸 06: KYC Screen...')
    await page.goto(`${BASE_URL}/members/434d1b45-b5e0-4985-bbc1-37575997b6aa`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(screenshotsDir, '06_kyc_verification_screen.png') })
  } catch (e) { console.error('Error 06:', e.message) }

  // 09: Conduct Meeting Interface
  try {
    console.log('📸 09: Meeting Conduct Table...')
    await page.goto(`${BASE_URL}/meetings/1fdcdb3e-d47b-4872-929c-169865d8c93f`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(screenshotsDir, '09_meeting_conducting_table.png') })
  } catch (e) { console.error('Error 09:', e.message) }

  // 11: Loan Details & EMI Schedule
  try {
    console.log('📸 11: Loan Schedule...')
    await page.goto(`${BASE_URL}/loans/968eb17e-6770-4319-aafd-3458ac8f8357`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(screenshotsDir, '11_loan_approval_and_schedule.png') })
  } catch (e) { console.error('Error 11:', e.message) }

  // 13: Reports & Registers
  try {
    console.log('📸 13: Financial Reports...')
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(screenshotsDir, '13_admin_reports_register.png') })
  } catch (e) { console.error('Error 13:', e.message) }

  // Switch to Member Auth Cookie
  try {
    console.log('🔑 Switching session to Member (434d1b45-b5e0-4985-bbc1-37575997b6aa)...')
    const memberToken = await createToken({
      memberId: '434d1b45-b5e0-4985-bbc1-37575997b6aa',
      organizationId: 'f15339a7-1d5a-4007-9650-17798841d665',
      role: 'MEMBER'
    })

    await page.setCookie({
      name: 'bb_token',
      value: memberToken,
      domain: DOMAIN,
      path: '/',
      httpOnly: true,
      secure: true
    })

    // 12: Member Passbook
    console.log('📸 12: Member Passbook...')
    await page.goto(`${BASE_URL}/member/passbook`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(screenshotsDir, '12_member_passbook_view.png') })
  } catch (e) { console.error('Error 12:', e.message) }

  console.log('🎉 All automated screenshots process completed!')
  await browser.close()
}

run()
