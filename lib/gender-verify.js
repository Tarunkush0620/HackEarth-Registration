// Gender verification utility for IEEE WIE HackEarth 2.0
// All-female teams qualify for a special ₹200 discount (pay ₹200 instead of standard ₹400).

const MALE_TITLES = new Set(['mr', 'mr.', 'master', 'shri', 'shree']);
const FEMALE_TITLES = new Set(['ms', 'ms.', 'mrs', 'mrs.', 'miss', 'shrimati', 'smt', 'smt.']);
const NEUTRAL_TITLES = new Set(['dr', 'dr.', 'prof', 'prof.', 'er', 'er.']);

// Common exclusively male names to prevent discount exploitation
const MALE_NAMES = new Set([
  // Common Indian male names
  'aakash', 'aarav', 'aashish', 'aayush', 'abhay', 'abhi', 'abhinav', 'abhishek', 'achyut',
  'adarsh', 'adit', 'aditya', 'agastya', 'ajay', 'ajit', 'akash', 'akhil', 'akshat', 'akshay',
  'alok', 'aman', 'amar', 'amit', 'amitabh', 'amol', 'anand', 'anant', 'aniket', 'aniruddh',
  'anirudh', 'ankit', 'ankush', 'anmol', 'ansh', 'anshul', 'anuj', 'anupam', 'anurag', 'aravind',
  'arjun', 'armaan', 'arnav', 'arun', 'arvind', 'aryan', 'ashish', 'ashok', 'ashutosh', 'ashwin',
  'atharv', 'avi', 'avinash', 'ayan', 'ayush', 'balram', 'basant', 'bhagat', 'bharat', 'bhaskar',
  'bhavesh', 'bhuvnesh', 'bijoy', 'bipin', 'brijesh', 'chaitanya', 'chandan', 'chandra', 'chetan',
  'chirag', 'daksh', 'dalip', 'damodar', 'darshan', 'deep', 'deepak', 'dev', 'devendra', 'devraj',
  'dhananjay', 'dhaval', 'dhiraj', 'dhirendra', 'dhruv', 'dilip', 'dinesh', 'divyansh', 'durgesh',
  'dushyant', 'gagan', 'gajendra', 'ganesh', 'gaurav', 'gautam', 'girish', 'gopal', 'govind',
  'gulshan', 'gurdeep', 'hardik', 'hari', 'harish', 'harsh', 'harshad', 'harshit', 'hemant',
  'hitesh', 'hrithik', 'inder', 'inderjeet', 'indrajit', 'ishan', 'ishwar', 'jagat', 'jagdish',
  'jai', 'jaideep', 'janak', 'jaswant', 'jatin', 'jay', 'jayant', 'jayesh', 'jeet', 'jeetu',
  'jitendra', 'joginder', 'jugal', 'kailash', 'kamal', 'kamlesh', 'kapil', 'karan', 'kartik',
  'kaushal', 'kaushik', 'kavit', 'keshav', 'kishore', 'krish', 'krishna', 'krishnakant', 'kuldeep',
  'kunal', 'kushal', 'lakshay', 'lakshman', 'lalit', 'lokesh', 'madan', 'madhav', 'mahendra',
  'mahesh', 'manav', 'manan', 'mandeep', 'manik', 'manish', 'manjit', 'manoj', 'manu', 'mayank',
  'mihir', 'milind', 'mohan', 'mohit', 'mukesh', 'mukul', 'murli', 'nakul', 'naman', 'naresh',
  'navneet', 'neelesh', 'neeraj', 'nikhil', 'nilesh', 'nimesh', 'nipun', 'nishant', 'nishith',
  'nitin', 'nitesh', 'om', 'omprakash', 'palash', 'pankaj', 'paras', 'paresh', 'parikshit',
  'parth', 'parveen', 'pavan', 'piyush', 'prabhat', 'prabhu', 'pradeep', 'pradip', 'praful',
  'pragyan', 'prakash', 'pranay', 'praneet', 'prasad', 'prashant', 'prateek', 'pratham',
  'prathamesh', 'praveen', 'pravin', 'prem', 'prince', 'priyank', 'priyanshu', 'pujan', 'puneet',
  'pushkar', 'rahul', 'raj', 'rajan', 'rajat', 'rajeev', 'rajen', 'rajendra', 'rajesh', 'rajiv',
  'rakesh', 'ram', 'raman', 'ramesh', 'ranbir', 'randeep', 'ranjit', 'ratan', 'ravi', 'ravindra',
  'rishi', 'rishabh', 'ritesh', 'rithvik', 'rohan', 'rohit', 'ronit', 'rudra', 'rupesh',
  'ruturaj', 'sachin', 'sagar', 'sahil', 'sailesh', 'samar', 'sambhav', 'samir', 'samrat',
  'sandeep', 'sanjay', 'sanjeev', 'santosh', 'sarang', 'sarvesh', 'sarthak', 'satendra',
  'satish', 'satyam', 'saurabh', 'saumya', 'shailendra', 'shailesh', 'shantanu', 'sharad',
  'shashank', 'shashi', 'shashikant', 'shivam', 'shivendra', 'shobhit', 'shray', 'shreyash',
  'shrikant', 'shrinath', 'shubham', 'shyam', 'siddharth', 'somesh', 'sonu', 'subhash', 'sudhir',
  'sujit', 'sumit', 'sunil', 'suresh', 'surya', 'suryansh', 'sushant', 'swapnil', 'tanmay',
  'tanuj', 'tarun', 'tej', 'tejas', 'trilok', 'tushar', 'uday', 'ujjwal', 'umang', 'umesh',
  'utkarsh', 'uttam', 'vaibhav', 'varun', 'vasu', 'ved', 'vedant', 'veer', 'vidur', 'vidyut',
  'vijay', 'vikas', 'vikram', 'vikrant', 'vimal', 'vinay', 'vinod', 'vipin', 'viplav', 'vipul',
  'virendra', 'virat', 'vishal', 'vishesh', 'vishnu', 'vishwas', 'vivek', 'vyan', 'yash',
  'yashwant', 'yogesh', 'yuvraj',

  // Common Western/global male names
  'john', 'david', 'michael', 'james', 'robert', 'william', 'joseph', 'thomas', 'charles',
  'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'stephen', 'jonathan', 'larry', 'justin', 'scott',
  'brandon', 'frank', 'benjamin', 'gregory', 'samuel', 'raymond', 'patrick', 'alexander',
  'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'henry', 'douglas', 'peter', 'adam', 'nathan',
  'zachary', 'walter', 'harold', 'carl', 'jeremy', 'keith', 'roger', 'gerald', 'ethan',
  'arthur', 'terry', 'christian', 'sean', 'lawrence', 'austin', 'joe', 'noah', 'jesse',
  'albert', 'bryan', 'billy', 'bruce', 'willie', 'dylan', 'alan', 'ralph', 'gabriel',
  'roy', 'juan', 'wayne', 'eugene', 'logan', 'randy', 'louis', 'russell', 'vincent',
  'philip', 'bobby', 'johnny', 'bradley'
]);

function extractNameTokens(fullName = '') {
  return String(fullName)
    .toLowerCase()
    .replace(/[^a-z\s.]/g, ' ')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractEmailTokens(email = '') {
  const localPart = String(email).split('@')[0] || '';
  return localPart
    .toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .split(/\s+/)
    .filter((s) => s.length >= 3);
}

/**
 * Validates a member's gender against their provided name and email.
 * Returns an error string if discrepancy is detected, or null if valid.
 */
function verifyMemberGender(name, email, gender, roleLabel = 'Member') {
  const g = String(gender || '').toLowerCase().trim();
  if (!['female', 'male', 'other'].includes(g)) {
    return 'Please select a gender (Female, Male, or Other).';
  }

  // Name tokens analysis
  const nameTokens = extractNameTokens(name);
  if (nameTokens.length === 0) {
    return 'Please provide a valid full name.';
  }

  const firstToken = nameTokens[0];
  const secondToken = nameTokens[1];

  let firstName = firstToken;
  if (MALE_TITLES.has(firstToken) || FEMALE_TITLES.has(firstToken) || NEUTRAL_TITLES.has(firstToken)) {
    firstName = secondToken || firstToken;
  }

  // Check titles
  if (g === 'female' && MALE_TITLES.has(firstToken)) {
    return `${roleLabel} has male title ("${firstToken}"), but gender is selected as Female.`;
  }
  if (g === 'male' && FEMALE_TITLES.has(firstToken)) {
    return `${roleLabel} has female title ("${firstToken}"), but gender is selected as Male.`;
  }

  // If claimed as female, verify against exclusively male names
  if (g === 'female') {
    if (MALE_NAMES.has(firstName)) {
      return `${roleLabel} name "${firstName}" indicates a male participant, but gender is selected as Female.`;
    }

    // Check email prefix for obvious male name match
    const emailTokens = extractEmailTokens(email);
    for (const token of emailTokens) {
      if (MALE_NAMES.has(token) && token === firstName) {
        return `${roleLabel} email and name match male name "${token}". All-women discount requires all members to be female.`;
      }
    }
  }

  return null;
}

/**
 * Evaluates team-wide discount eligibility.
 */
function evaluateTeamDiscount(members = []) {
  if (!Array.isArray(members) || members.length === 0) {
    return { isAllFemale: false, fee: 400, discount: 0 };
  }

  const allFemale = members.every((m) => String(m.gender).toLowerCase().trim() === 'female');
  if (allFemale) {
    return {
      isAllFemale: true,
      fee: 200,
      discount: 200,
      badge: 'All-Women Team Discount Applied (₹200)',
    };
  }

  return {
    isAllFemale: false,
    fee: 400,
    discount: 0,
    badge: 'Standard Team Registration (₹400)',
  };
}

module.exports = {
  verifyMemberGender,
  evaluateTeamDiscount,
  MALE_NAMES,
};

