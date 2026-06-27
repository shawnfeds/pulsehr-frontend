// Mock data — mirrors expected .NET API response shapes exactly

export const MOCK_EMPLOYEES = [
  { id: 1, name: 'Priya Sharma', email: 'priya@nexus.io', role: 'Software Engineer', dept: 'Engineering', status: 'active', joinDate: '2022-03-15', projects: [1, 3], salary: 95000, avatar: 'PS', avatarColor: '#7c3aed', phone: '+91 98765 43210', location: 'Bengaluru, KA' },
  { id: 2, name: 'Rohan Mehta', email: 'rohan@nexus.io', role: 'Product Manager', dept: 'Product', status: 'active', joinDate: '2021-07-10', projects: [1, 2], salary: 110000, avatar: 'RM', avatarColor: '#059669', phone: '+91 87654 32109', location: 'Mumbai, MH' },
  { id: 3, name: 'Ananya Patel', email: 'ananya@nexus.io', role: 'UX Designer', dept: 'Design', status: 'active', joinDate: '2023-01-05', projects: [2, 4], salary: 88000, avatar: 'AP', avatarColor: '#d97706', phone: '+91 76543 21098', location: 'Pune, MH' },
  { id: 4, name: 'Kavya Nair', email: 'kavya@nexus.io', role: 'Data Analyst', dept: 'Analytics', status: 'active', joinDate: '2022-09-20', projects: [3], salary: 82000, avatar: 'KN', avatarColor: '#dc2626', phone: '+91 65432 10987', location: 'Hyderabad, TS' },
  { id: 5, name: 'Arjun Iyer', email: 'arjun@nexus.io', role: 'DevOps Engineer', dept: 'Engineering', status: 'active', joinDate: '2020-11-12', projects: [1, 4], salary: 105000, avatar: 'AI', avatarColor: '#2563eb', phone: '+91 54321 09876', location: 'Chennai, TN' },
  { id: 6, name: 'Sneha Reddy', email: 'sneha@nexus.io', role: 'HR Manager', dept: 'HR', status: 'active', joinDate: '2019-06-01', projects: [], salary: 90000, avatar: 'SR', avatarColor: '#0891b2', phone: '+91 43210 98765', location: 'Bengaluru, KA' },
  { id: 7, name: 'Vikram Singh', email: 'vikram@nexus.io', role: 'Backend Developer', dept: 'Engineering', status: 'inactive', joinDate: '2021-02-14', projects: [2], salary: 92000, avatar: 'VS', avatarColor: '#be185d', phone: '+91 32109 87654', location: 'Delhi, DL' },
  { id: 8, name: 'Meera Kumar', email: 'meera@nexus.io', role: 'Marketing Lead', dept: 'Marketing', status: 'active', joinDate: '2022-05-30', projects: [4], salary: 85000, avatar: 'MK', avatarColor: '#16a34a', phone: '+91 21098 76543', location: 'Bengaluru, KA' },
];

export const MOCK_PROJECTS = [
  { id: 1, name: 'Nexus Platform v2.0', manager: 'Rohan Mehta', status: 'active', startDate: '2024-01-15', endDate: '2024-12-31', progress: 65, members: [1, 2, 5], description: 'Major platform rewrite with microservices architecture' },
  { id: 2, name: 'Customer Portal Redesign', manager: 'Ananya Patel', status: 'active', startDate: '2024-03-01', endDate: '2024-09-30', progress: 40, members: [2, 3, 7], description: 'Complete redesign of the customer-facing portal' },
  { id: 3, name: 'Data Lake Migration', manager: 'Kavya Nair', status: 'on-hold', startDate: '2024-02-10', endDate: '2024-11-30', progress: 25, members: [1, 4], description: 'Migrating analytics pipeline to cloud data lake' },
  { id: 4, name: 'Mobile App Launch', manager: 'Rohan Mehta', status: 'active', startDate: '2024-04-01', endDate: '2024-12-15', progress: 15, members: [3, 5, 8], description: 'Consumer mobile app for iOS and Android' },
];

export const MOCK_LEAVES = [
  { id: 1, employeeId: 1, employeeName: 'Priya Sharma', type: 'Sick', startDate: '2024-04-10', endDate: '2024-04-11', days: 2, status: 'approved', reason: 'Fever and cold', halfDay: false },
  { id: 2, employeeId: 1, employeeName: 'Priya Sharma', type: 'Casual', startDate: '2024-05-20', endDate: '2024-05-20', days: 0.5, status: 'pending', reason: 'Personal work', halfDay: true },
  { id: 3, employeeId: 2, employeeName: 'Rohan Mehta', type: 'Casual', startDate: '2024-03-25', endDate: '2024-03-27', days: 3, status: 'approved', reason: 'Family trip', halfDay: false },
  { id: 4, employeeId: 3, employeeName: 'Ananya Patel', type: 'Sick', startDate: '2024-04-28', endDate: '2024-04-29', days: 2, status: 'rejected', reason: 'Not feeling well', halfDay: false },
  { id: 5, employeeId: 4, employeeName: 'Kavya Nair', type: 'Casual', startDate: '2024-05-15', endDate: '2024-05-17', days: 3, status: 'pending', reason: 'Attending wedding', halfDay: false },
];

export const MOCK_TIMESHEETS = [
  { id: 1, employeeId: 1, date: '2024-04-29', projectId: 1, project: 'Nexus Platform v2.0', task: 'Implement authentication module', hours: 6, month: 'April 2024' },
  { id: 2, employeeId: 1, date: '2024-04-28', projectId: 3, project: 'Data Lake Migration', task: 'Schema design review', hours: 3, month: 'April 2024' },
  { id: 3, employeeId: 1, date: '2024-04-27', projectId: 0, project: 'General', task: 'Team standup & planning', hours: 2, month: 'April 2024' },
  { id: 4, employeeId: 1, date: '2024-04-26', projectId: 1, project: 'Nexus Platform v2.0', task: 'Code review and documentation', hours: 5, month: 'April 2024' },
  { id: 5, employeeId: 1, date: '2024-04-25', projectId: 1, project: 'Nexus Platform v2.0', task: 'Unit test coverage', hours: 7, month: 'April 2024' },
];

export const MOCK_POLICIES = [
  { id: 1, name: 'Leave Policy 2024', category: 'HR', uploadedBy: 'Sneha Reddy', uploadedOn: '2024-01-10', size: '245 KB', type: 'pdf' },
  { id: 2, name: 'Code of Conduct', category: 'Compliance', uploadedBy: 'Sneha Reddy', uploadedOn: '2024-01-10', size: '128 KB', type: 'pdf' },
  { id: 3, name: 'Work From Home Guidelines', category: 'HR', uploadedBy: 'Sneha Reddy', uploadedOn: '2024-02-15', size: '89 KB', type: 'pdf' },
  { id: 4, name: 'IT Security Policy', category: 'IT', uploadedBy: 'Arjun Iyer', uploadedOn: '2024-01-20', size: '312 KB', type: 'pdf' },
  { id: 5, name: 'Travel & Expense Policy', category: 'Finance', uploadedBy: 'Sneha Reddy', uploadedOn: '2024-03-01', size: '176 KB', type: 'pdf' },
];

export const MOCK_HOLIDAYS = [
  { id: 1, name: 'Republic Day', date: '2024-01-26', type: 'National' },
  { id: 2, name: 'Holi', date: '2024-03-25', type: 'Festival' },
  { id: 3, name: 'Good Friday', date: '2024-03-29', type: 'Optional' },
  { id: 4, name: 'Ram Navami', date: '2024-04-17', type: 'Festival' },
  { id: 5, name: 'Independence Day', date: '2024-08-15', type: 'National' },
  { id: 6, name: 'Diwali', date: '2024-11-01', type: 'Festival' },
  { id: 7, name: 'Christmas', date: '2024-12-25', type: 'National' },
];

export const MOCK_EVENTS = [
  { id: 1, name: 'Q2 All-Hands Meeting', date: '2024-05-15', type: 'Meeting', description: 'Quarterly company-wide meeting' },
  { id: 2, name: 'Annual Hackathon', date: '2024-06-07', type: 'Event', description: '24-hour internal hackathon' },
  { id: 3, name: 'Team Building Day', date: '2024-07-20', type: 'Social', description: 'Outdoor team activities' },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Your leave request has been approved', time: '10 min ago', read: false },
  { id: 2, text: 'Kavya Nair submitted a timesheet', time: '1 hr ago', read: false },
  { id: 3, text: 'New company policy uploaded', time: '3 hrs ago', read: true },
  { id: 4, text: 'Performance review due in 3 days', time: 'Yesterday', read: true },
];

export const CURRENT_USER = {
  id: 1, name: 'Priya Sharma', email: 'priya@nexus.io',
  role: 'Software Engineer', dept: 'Engineering',
  avatar: 'PS', avatarColor: '#7c3aed',
  projects: [1, 3], salary: 95000,
  joinDate: '2022-03-15', phone: '+91 98765 43210',
  location: 'Bengaluru, KA',
};

export const EMPLOYEE_HISTORY = [
  { id: 1, date: '2022-03-15', event: 'Joined', role: 'Junior Software Engineer', dept: 'Engineering' },
  { id: 2, date: '2023-01-01', event: 'Promotion', role: 'Software Engineer', dept: 'Engineering' },
  { id: 3, date: '2024-01-01', event: 'Salary Revision', role: 'Software Engineer', dept: 'Engineering' },
];

export const SALARY_HISTORY = [
  { id: 1, date: '2022-03-15', amount: 70000, note: 'Joining CTC' },
  { id: 2, date: '2023-01-01', amount: 85000, note: 'Annual Appraisal + Promotion' },
  { id: 3, date: '2024-01-01', amount: 95000, note: 'Annual Appraisal' },
];

export const LEAVE_SUMMARY = {
  sick: { total: 12, used: 2, balance: 10 },
  casual: { total: 12, used: 0.5, balance: 11.5 },
};
