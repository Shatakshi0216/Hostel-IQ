require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const AllocationRule = require('../models/AllocationRule');
const Complaint = require('../models/Complaint');

// Import allocation service functions to run them dynamically
const { runHostelAllocation } = require('../services/allocationService');
const { runRoommateAllocation } = require('../services/matchingService');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hosteliq');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // 1. Clean Database
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await Hostel.deleteMany();
    await Room.deleteMany();
    await AllocationRule.deleteMany();
    await Complaint.deleteMany();

    console.log('Database cleared.');

    // 2. Seed Default Allocation Rules
    await AllocationRule.create([
      { criterionName: 'CGPA', weightPercent: 40, isActive: true },
      { criterionName: 'RegionalContribution', weightPercent: 20, isActive: true },
      { criterionName: 'AcademicYear', weightPercent: 30, isActive: true },
      { criterionName: 'SpecialCategory', weightPercent: 10, isActive: true },
    ]);
    console.log('Allocation rules seeded.');

    // 3. Seed Hostels (10 Boys, 5 Girls with academic year rules)
    const boysHostels = [];
    for (let i = 1; i <= 10; i++) {
      let allowedCohorts = ['BTech 1'];
      let totalCapacity = 360; // 120 rooms * 3
      if (i > 3 && i <= 6) {
        allowedCohorts = ['BTech 2'];
        totalCapacity = 240; // 120 rooms * 2
      } else if (i > 6 && i <= 8) {
        allowedCohorts = ['BTech 3', 'MTech'];
        totalCapacity = 240; // 120 rooms * 2
      } else if (i > 8) {
        allowedCohorts = ['BTech 4', 'PhD', 'MCA'];
        totalCapacity = 120; // 120 rooms * 1
      }

      const h = await Hostel.create({
        name: `B${i}`,
        genderRestriction: 'Boys',
        totalCapacity,
        allowedCohorts
      });
      boysHostels.push(h);
    }

    const girlsHostels = [];
    for (let i = 1; i <= 5; i++) {
      let allowedCohorts = ['BTech 1'];
      let totalCapacity = 360; // 120 rooms * 3
      if (i === 3) {
        allowedCohorts = ['BTech 2'];
        totalCapacity = 240; // 120 rooms * 2
      } else if (i === 4) {
        allowedCohorts = ['BTech 3', 'MTech', 'MCA'];
        totalCapacity = 240; // 120 rooms * 2
      } else if (i === 5) {
        allowedCohorts = ['BTech 4', 'PhD'];
        totalCapacity = 120; // 120 rooms * 1
      }

      const h = await Hostel.create({
        name: `G${i}`,
        genderRestriction: 'Girls',
        totalCapacity,
        allowedCohorts
      });
      girlsHostels.push(h);
    }
    console.log('Hostels seeded with year-restriction configs.');

    // 4. Seed Admin & Warden Users
    const admin = await User.create({
      name: 'Super Administrator',
      email: 'admin@hosteliq.com',
      password: 'admin123#2026',
      role: 'SuperAdmin',
      phone: '+91 99999 88888'
    });

    const boysWardenNames = [
      'Dr. Satish Chandra', 'Dr. Ramesh Nair', 'Dr. Anand Kulkarni', 'Dr. Rajesh Gupta', 
      'Dr. Vijay Deshmukh', 'Dr. Manoj Pandey', 'Dr. Harish Kumar', 'Dr. Sanjay Sen', 
      'Dr. Sunil Verma', 'Dr. Nitin Mishra'
    ];

    // Seed Warden for each Boys Hostel (B1-B10)
    for (let i = 0; i < boysHostels.length; i++) {
      const hostel = boysHostels[i];
      await User.create({
        name: boysWardenNames[i],
        email: `warden_${hostel.name.toLowerCase()}@hosteliq.com`,
        password: `warden_${hostel.name.toLowerCase()}#2026`,
        role: 'HostelAdmin',
        managedHostelId: hostel._id,
        phone: `+91 98765 4320${i + 1}`
      });
    }

    const girlsWardenNames = [
      'Dr. Shalini Iyer', 'Dr. Sunita Rao', 'Dr. Anjali Das', 'Dr. Preeti Goel', 'Dr. Tanvi Bose'
    ];

    // Seed Warden for each Girls Hostel (G1-G5)
    for (let i = 0; i < girlsHostels.length; i++) {
      const hostel = girlsHostels[i];
      await User.create({
        name: girlsWardenNames[i],
        email: `warden_${hostel.name.toLowerCase()}@hosteliq.com`,
        password: `warden_${hostel.name.toLowerCase()}#2026`,
        role: 'HostelAdmin',
        managedHostelId: hostel._id,
        phone: `+91 98765 4321${i + 1}`
      });
    }

    console.log('Admin & Wardens seeded.');

    // 5. Seed Rooms dynamically (4 floors, 30 rooms per floor = 120 rooms per hostel)
    const roomsToCreate = [];
    const allHostels = [...boysHostels, ...girlsHostels];

    allHostels.forEach((hostel) => {
      const blockName = hostel.genderRestriction === 'Boys' ? 'Block A' : 'Block B';
      
      // Bed configuration per cohort:
      // If allowedCohorts contains BTech 1 -> 3 beds
      // If it contains BTech 4 or PhD but not BTech 1 or 2 -> 1 bed (single)
      // Else -> 2 beds
      let capacity = 2;
      if (hostel.allowedCohorts.includes('BTech 1')) {
        capacity = 3;
      } else if (
        (hostel.allowedCohorts.includes('BTech 4') || hostel.allowedCohorts.includes('PhD')) &&
        !hostel.allowedCohorts.includes('BTech 1') &&
        !hostel.allowedCohorts.includes('BTech 2')
      ) {
        capacity = 1;
      }

      for (let floorNum = 1; floorNum <= 4; floorNum++) {
        for (let roomIdx = 1; roomIdx <= 30; roomIdx++) {
          const roomNumber = `${floorNum}${roomIdx < 10 ? '0' + roomIdx : roomIdx}`;
          
          roomsToCreate.push({
            hostelId: hostel._id,
            block: blockName,
            floor: floorNum,
            roomNumber,
            capacity
          });
        }
      }
    });

    await Room.insertMany(roomsToCreate);
    console.log('Rooms seeded with occupancy limits (capacities 1, 2, 3, 4).');

    // 6. Generate 35 Boys and 35 Girls profiles dynamically
    const boysNames = [
      'Rahul Sharma', 'Aryan Mehta', 'Aman Patel', 'Rohan Deshmukh', 'Siddharth Sen',
      'Kabir Kapoor', 'Vikram Singh', 'Amit Verma', 'Abhishek Mishra', 'Sanjay Kumar',
      'Manish Pandey', 'Yash Vardhan', 'Sameer Sen', 'Tushar Kapoor', 'Raman Singh',
      'Mohit Suri', 'Kartik Aaryan', 'Naveen Kumar', 'Saurabh Jain', 'Pankaj Yadav',
      'Deepak Verma', 'Alok Tiwari', 'Gaurav Jha', 'Nitin Sharma', 'Vinay Prasad',
      'Akash Mishra', 'Swadesh Pal', 'Pranjal Das', 'Sumit Roy', 'Vivek Dube',
      'Ankit Dwivedi', 'Tarun Sinha', 'Ritesh Deshmukh', 'Hemant Joshi', 'Puneet Soni'
    ];

    const girlsNames = [
      'Priya Iyer', 'Neha Gupta', 'Ananya Rao', 'Sneha Nair', 'Pooja Joshi',
      'Rita Biswas', 'Sita Ramaswamy', 'Amrita Rao', 'Kavita Sharma', 'Ritu Sen',
      'Divya Patel', 'Aarti Mishra', 'Preeti Goel', 'Jyoti Singh', 'Anjali Das',
      'Megha Roy', 'Tanvi Bose', 'Shreya Pandey', 'Ruchi Saxena', 'Nidhi Agrawal',
      'Swati Tiwari', 'Kiran Yadav', 'Archana Singh', 'Poonam Verma', 'Vandana Kumari',
      'Shalini Nair', 'Renu Joshi', 'Payal Shah', 'Monika Dubey', 'Bharti Sharma',
      'Sweta Tiwari', 'Sunita Rao', 'Prema Lal', 'Deepali Deshmukh', 'Lalita Iyer'
    ];

    const branches = ['CSE', 'ECE', 'ME', 'CE'];
    const regions = ['Delhi', 'Maharashtra', 'Uttar Pradesh', 'Karnataka', 'Tamil Nadu', 'Rajasthan'];
    const sleep = ['early_bird', 'night_owl', 'flexible'];
    const wake = ['early', 'moderate', 'late'];
    const game = ['none', 'casual', 'heavy'];
    const music = ['headphones', 'speakers', 'none'];
    const sports = ['Cricket', 'Football', 'Chess', 'Basketball', 'Badminton'];
    const tags = ['Quiet', 'Focused', 'Friendly', 'Studious', 'Gamer', 'Outgoing'];

    const studentUserIds = [];

    // Helper to generate a random item from array
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // Helper to generate a slice of array
    const randSlice = (arr, num) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, num);
    };

    // Seed Boys
    for (let name of boysNames) {
      const email = `${name.toLowerCase().replace(' ', '')}@university.edu`;
      const user = await User.create({
        name,
        email,
        password: 'password123',
        role: 'Student',
      });
      studentUserIds.push(user._id);

      await StudentProfile.create({
        userId: user._id,
        cgpa: parseFloat((6.0 + Math.random() * 4.0).toFixed(2)),
        batch: rand(['2021', '2022', '2023', '2024']),
        branch: rand(branches),
        region: rand(regions),
        gender: 'Male',
        floorPreference: rand(['Ground Floor', 'First Floor', 'Second Floor', 'No Preference']),
        academicYear: rand(['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD']),
        category: rand(['General', 'SC_ST', 'OBC', 'EWS']),
        hasDisability: Math.random() < 0.05,
        hasScholarship: Math.random() < 0.15,
        sportsQuota: Math.random() < 0.1,
        roommateCompatibilityProfile: {
          sleepSchedule: rand(sleep),
          wakeTime: rand(wake),
          cleanlinessRating: Math.floor(Math.random() * 5) + 1,
          studyHabit: 'flexible',
          introvertExtrovertScale: Math.floor(Math.random() * 5) + 1,
          gamingHabit: rand(game),
          musicPreference: rand(music),
          sportsInterests: randSlice(sports, 2),
          languagesSpoken: ['English', 'Hindi'],
          personalityTags: randSlice(tags, 2),
        },
        preferredRoommates: [],
      });
    }

    // Seed Girls
    for (let name of girlsNames) {
      const email = `${name.toLowerCase().replace(' ', '')}@university.edu`;
      const user = await User.create({
        name,
        email,
        password: 'password123',
        role: 'Student',
      });
      studentUserIds.push(user._id);

      await StudentProfile.create({
        userId: user._id,
        cgpa: parseFloat((6.0 + Math.random() * 4.0).toFixed(2)),
        batch: rand(['2021', '2022', '2023', '2024']),
        branch: rand(branches),
        region: rand(regions),
        gender: 'Female',
        floorPreference: rand(['Ground Floor', 'First Floor', 'Second Floor', 'No Preference']),
        academicYear: rand(['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD']),
        category: rand(['General', 'SC_ST', 'OBC', 'EWS']),
        hasDisability: Math.random() < 0.05,
        hasScholarship: Math.random() < 0.15,
        sportsQuota: Math.random() < 0.1,
        roommateCompatibilityProfile: {
          sleepSchedule: rand(sleep),
          wakeTime: rand(wake),
          cleanlinessRating: Math.floor(Math.random() * 5) + 1,
          studyHabit: 'flexible',
          introvertExtrovertScale: Math.floor(Math.random() * 5) + 1,
          gamingHabit: rand(game),
          musicPreference: rand(music),
          sportsInterests: randSlice(sports, 2),
          languagesSpoken: ['English', 'Hindi'],
          personalityTags: randSlice(tags, 2),
        },
        preferredRoommates: [],
      });
    }

    // Set up a few mutual preferences for boys
    const rahulUser = await User.findOne({ name: 'Rahul Sharma' });
    const aryanUser = await User.findOne({ name: 'Aryan Mehta' });
    if (rahulUser && aryanUser) {
      const rahulProfile = await StudentProfile.findOne({ userId: rahulUser._id });
      const aryanProfile = await StudentProfile.findOne({ userId: aryanUser._id });
      if (rahulProfile && aryanProfile) {
        rahulProfile.preferredRoommates.push(aryanUser._id);
        await rahulProfile.save();
        aryanProfile.preferredRoommates.push(rahulUser._id);
        await aryanProfile.save();
      }
    }

    // Set up mutual preferences for girls
    const priyaUser = await User.findOne({ name: 'Priya Iyer' });
    const nehaUser = await User.findOne({ name: 'Neha Gupta' });
    if (priyaUser && nehaUser) {
      const priyaProfile = await StudentProfile.findOne({ userId: priyaUser._id });
      const nehaProfile = await StudentProfile.findOne({ userId: nehaUser._id });
      if (priyaProfile && nehaProfile) {
        priyaProfile.preferredRoommates.push(nehaUser._id);
        await priyaProfile.save();
        nehaProfile.preferredRoommates.push(priyaUser._id);
        await nehaProfile.save();
      }
    }

    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(seedData);
