const axios = require('axios');
const moment = require('moment');
const FormData = require('form-data');

async function markAttendance() {
  try {
    const employees = JSON.parse(process.env.EMPLOYEES || '[]');

    if (employees.length === 0) {
      console.log('No employees found. Please check the EMPLOYEES environment variable.');
      return;
    }

    const loginURL = process.env.LOGIN_URL;
    const companyDomainCode = process.env.COMPANY;
    const markAttendanceURL = process.env.MARK_ATTENDANCE_URL;

    if (!loginURL || !companyDomainCode || !markAttendanceURL) {
      console.error('Missing required environment variables. Please ensure LOGIN_URL, COMPANY, and MARK_ATTENDANCE_URL are set.');
      return;
    }

    // Loop through each employee and mark attendance
    for (const employee of employees) {
      const formData = new FormData();
      console.log(JSON.stringify(employee), employee)
      formData.append('username', employee.username);
      formData.append('password', employee.password);
      formData.append('grant_type', 'password');
      formData.append('loginType', '1');
      formData.append('companyDomainCode', companyDomainCode);
      formData.append('isUpdated', '1');
      formData.append('validSource', '1');

      try {
        // Perform login request
        const loginResponse = await axios.post(loginURL, formData, {
          headers: formData.getHeaders(),
        });

        // Check for access token
        const accessToken = loginResponse?.data?.access_token;
        if (accessToken) {
          const markPayload = {
            requestType: 'A',
            employeeId: employee.employeeId,
            punchTime: moment().format('YYYY-MM-DD HH:mm'),
            attendanceSource: 'A',
            attendanceType: 'Online',
          };

          const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          };

          // Perform mark attendance request
          const attendanceResponse = await axios.post(markAttendanceURL, markPayload, { headers });

          console.log(
            `Employee ${employee.employeeId}: ${attendanceResponse.data.message}`,
            moment().format('YYYY-MM-DD HH:mm')
          );
        } else {
          console.error(
            `Employee ${employee.employeeId}: Failed to retrieve access token. Response message: ${loginResponse?.data?.message || 'No message available'}`
          );
        }
      } catch (error) {
        console.error(`Error for employee ${employee.employeeId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in markAttendance function:', error.message);
    console.error('Error:', error);
  }
}

markAttendance();
