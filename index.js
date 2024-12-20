const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const API_BASE_URL = 'https://dp33c1xwtxufgln-db202204160934.adb.us-phoenix-1.oraclecloudapps.com/ords/tardigrade_api/api/v1';
const API_HEADERS = {
  accept: 'application/json',
  'api-id': '34686896304275515009619259576594128842',
  'api-key': '7RCL9PDNQH5M1KF4LRCJP760Q60ZKI',
};

// Utility: Make an API call
const callApi = async (method, endpoint, payload = null) => {
  const options = {
    method: method.toUpperCase(),
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : null,
  };
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
};

// Fetch the latest SMS containing a Google verification code
const fetchLatestSMS = async (number = '4582457151') => {
  const result = await callApi('GET', `sms/${number}`);
  const sms = result.results.find((sms) => sms.message.includes('Google verification'));
  return sms ? sms.message.replace(/.*?(\\d+).*/, '$1') : '';
};

// Wait for a Google verification code via SMS with retries
const waitForVerificationCode = async (mobileNumber) => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = await fetchLatestSMS(mobileNumber);
    if (code) return code;
    console.log(`Attempt ${attempt + 1}: Waiting for verification code...`);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Retry every 10 seconds
  }
  throw new Error('Failed to retrieve verification code.');
};

// Automate Google Account creation
const createGoogleAccount = async ({ firstName, lastName, username, password, day, month, year, mobileNumber }) => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(90000); // Aligning with your explicit timeout approach

  try {
    console.log('Navigating to the signup page...');
    await page.goto('https://accounts.google.com/signup', { waitUntil: 'networkidle2' });

    console.log('Filling in the first and last names...');
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });
    await page.click('#collectNameNext');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Filling in birth date and gender...');
    await page.select('#month', month);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Custom delay
    await page.type('input[name="day"]', day, { delay: 50 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.type('#year', year);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.select('#gender', '1');
    await page.click('#birthdaygenderNext');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Entering mobile number...');
    await page.type('input[type="tel"]', mobileNumber, { delay: 50 });
    await page.click('#phoneNumberIdNext');

    console.log('Waiting for verification code...');
    const verificationCode = await waitForVerificationCode(mobileNumber);
    await page.type('input[id="code"]', verificationCode, { delay: 50 });
    await page.click('#next');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Setting up username and password...');
    await page.type('input[name="Username"]', username, { delay: 50 });
    await page.click('#usernameNext');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.type('input[name="Passwd"]', password, { delay: 50 });
    await page.type('input[name="PasswdAgain"]', password, { delay: 50 });
    await page.click('#createpasswordNext');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Google account creation completed successfully!');
  } catch (error) {
    console.error('Error during account creation:', error.message);
  } finally {
    console.log('Closing the browser...');
    await browser.close();
  }
};

// Test the account creation process
(async () => {
  const accountDetails = {
    firstName: 'Dareen',
    lastName: 'Johnson',
    username: 'harish.johnson.fiverr.123',
    password: 'DavidBayeda@1465',
    day: '22',
    month: '10',
    year: '1991',
    mobileNumber: '+1 9990304777',
  };
  await createGoogleAccount(accountDetails);
})();
