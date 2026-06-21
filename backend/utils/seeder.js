require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const AllocationRule = require('../models/AllocationRule');
const Complaint = require('../models/Complaint');

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

    // 3. Seed Hostels
    const tagoreHall = await Hostel.create({
      name: 'Tagore Hall',
      genderRestriction: 'Boys',
      totalCapacity: 12,
    });

    const sarojiniHall = await Hostel.create({
      name: 'Sarojini Hall',
      genderRestriction: 'Girls',
      totalCapacity: 12,
    });
    console.log('Hostels seeded (Tagore Hall - Boys, Sarojini Hall - Girls).');

    // 4. Seed Admin & Warden Users
    // Global Super Admin (Council of Wardens)
    const admin = await User.create({
      name: 'Super Administrator',
      email: 'admin@hosteliq.com',
      password: 'admin123',
      role: 'SuperAdmin',
    });

    // Warden for Tagore Hall (Boys)
    const tagoreWarden = await User.create({
      name: 'Warden Tagore',
      email: 'warden_tagore@hosteliq.com',
      password: 'warden123',
      role: 'HostelAdmin',
      managedHostelId: tagoreHall._id
    });

    // Warden for Sarojini Hall (Girls)
    const sarojiniWarden = await User.create({
      name: 'Warden Sarojini',
      email: 'warden_sarojini@hosteliq.com',
      password: 'warden123',
      role: 'HostelAdmin',
      managedHostelId: sarojiniHall._id
    });

    console.log('Admin & Wardens seeded (admin@hosteliq.com, warden_tagore@hosteliq.com, warden_sarojini@hosteliq.com).');

    // 5. Seed Rooms with year-dependent capacities (1, 2, 3)
    const roomsToCreate = [
      // Tagore Hall (Boys) - Block A. Total capacity = 12
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '101', capacity: 1 }, // 4th years
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '102', capacity: 1 }, // 4th years
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '103', capacity: 2 }, // 2nd/3rd years
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '104', capacity: 2 }, // 2nd/3rd years
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '105', capacity: 3 }, // 1st years
      { hostelId: tagoreHall._id, block: 'Block A', floor: 1, roomNumber: '106', capacity: 3 }, // 1st years

      // Sarojini Hall (Girls) - Block B. Total capacity = 12
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '201', capacity: 1 }, // 4th years
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '202', capacity: 1 }, // 4th years
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '203', capacity: 2 }, // 2nd/3rd years
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '204', capacity: 2 }, // 2nd/3rd years
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '205', capacity: 3 }, // 1st years
      { hostelId: sarojiniHall._id, block: 'Block B', floor: 1, roomNumber: '206', capacity: 3 }, // 1st years
    ];
    await Room.insertMany(roomsToCreate);
    console.log('Rooms seeded with occupancy limits (capacity 1, 2, 3).');

    // 6. Seed Students & Profiles (no distanceFromHome or smokingPreference)
    const studentsRaw = [
      // Boys (mix of 1st, 2nd, 3rd, 4th years)
      { name: 'Rahul Sharma', email: 'rahul@gmail.com', cgpa: 9.2, batch: '2023', branch: 'CSE', region: 'North', floorPref: 'First Floor', year: 1, category: 'General', sleep: 'early_bird', wake: 'early', clean: 5, game: 'none', music: 'headphones', sports: ['Cricket', 'Football'], lang: ['Hindi', 'English'], tags: ['Quiet', 'Focused'] },
      { name: 'Aryan Mehta', email: 'aryan@gmail.com', cgpa: 8.8, batch: '2023', branch: 'CSE', region: 'North', floorPref: 'First Floor', year: 1, category: 'General', sleep: 'early_bird', wake: 'early', clean: 4, game: 'casual', music: 'headphones', sports: ['Cricket'], lang: ['Hindi', 'English'], tags: ['Focused', 'Friendly'] },
      { name: 'Aman Patel', email: 'aman@gmail.com', cgpa: 7.5, batch: '2022', branch: 'ECE', region: 'West', floorPref: 'Ground Floor', year: 2, category: 'OBC', sleep: 'night_owl', wake: 'late', clean: 2, game: 'heavy', music: 'speakers', sports: ['Football', 'Gaming'], lang: ['Gujarati', 'English'], tags: ['Gamer', 'Outgoing'] },
      { name: 'Rohan Deshmukh', email: 'rohan@gmail.com', cgpa: 6.8, batch: '2022', branch: 'ECE', region: 'West', floorPref: 'Ground Floor', year: 2, category: 'General', sleep: 'night_owl', wake: 'late', clean: 2, game: 'heavy', music: 'speakers', sports: ['Gaming'], lang: ['Marathi', 'Hindi'], tags: ['Gamer', 'Chill'] },
      { name: 'Siddharth Sen', email: 'siddharth@gmail.com', cgpa: 9.5, batch: '2023', branch: 'CSE', region: 'East', floorPref: 'First Floor', year: 1, category: 'SC_ST', sleep: 'early_bird', wake: 'early', clean: 5, game: 'none', music: 'none', sports: ['Chess'], lang: ['Bengali', 'English'], tags: ['Quiet', 'Academic'] },
      { name: 'Kabir Kapoor', email: 'kabir@gmail.com', cgpa: 8.1, batch: '2021', branch: 'ME', region: 'North', floorPref: 'Second Floor', year: 3, category: 'General', sleep: 'flexible', wake: 'moderate', clean: 3, game: 'casual', music: 'headphones', sports: ['Basketball'], lang: ['Hindi', 'English'], tags: ['Friendly', 'Party'] },
      { name: 'Vikram Singh', email: 'vikram@gmail.com', cgpa: 7.9, batch: '2021', branch: 'ME', region: 'North', floorPref: 'Second Floor', year: 3, category: 'EWS', sleep: 'flexible', wake: 'moderate', clean: 3, game: 'casual', music: 'speakers', sports: ['Cricket'], lang: ['Hindi', 'Punjabi'], tags: ['Outgoing', 'Music'] },
      { name: 'Amit Verma', email: 'amit@gmail.com', cgpa: 8.4, batch: '2020', branch: 'CSE', region: 'North', floorPref: 'First Floor', year: 4, category: 'General', sleep: 'early_bird', wake: 'early', clean: 4, game: 'none', music: 'headphones', sports: ['Badminton'], lang: ['Hindi', 'English'], tags: ['Friendly', 'Focused'] },

      // Girls
      { name: 'Priya Iyer', email: 'priya@gmail.com', cgpa: 9.4, batch: '2023', branch: 'CSE', region: 'South', floorPref: 'Second Floor', year: 1, category: 'General', sleep: 'early_bird', wake: 'early', clean: 5, game: 'none', music: 'headphones', sports: ['Tennis', 'Badminton'], lang: ['Tamil', 'English'], tags: ['Studious', 'Quiet'] },
      { name: 'Neha Gupta', email: 'neha@gmail.com', cgpa: 9.0, batch: '2023', branch: 'CSE', region: 'North', floorPref: 'Second Floor', year: 1, category: 'General', sleep: 'early_bird', wake: 'early', clean: 5, game: 'none', music: 'headphones', sports: ['Badminton'], lang: ['Hindi', 'English'], tags: ['Studious', 'Friendly'] },
      { name: 'Ananya Rao', email: 'ananya@gmail.com', cgpa: 7.2, batch: '2022', branch: 'ECE', region: 'South', floorPref: 'Ground Floor', year: 2, category: 'OBC', sleep: 'night_owl', wake: 'late', clean: 3, game: 'casual', music: 'speakers', sports: ['Basketball'], lang: ['Telugu', 'English'], tags: ['Outgoing', 'Talkative'] },
      { name: 'Sneha Nair', email: 'sneha@gmail.com', cgpa: 8.0, batch: '2022', branch: 'ECE', region: 'South', floorPref: 'Ground Floor', year: 2, category: 'General', sleep: 'night_owl', wake: 'late', clean: 3, game: 'heavy', music: 'speakers', sports: ['Gaming'], lang: ['Malayalam', 'English'], tags: ['Gamer', 'Outgoing'] },
      { name: 'Pooja Joshi', email: 'pooja@gmail.com', cgpa: 8.5, batch: '2023', branch: 'CSE', region: 'North', floorPref: 'First Floor', year: 1, category: 'General', sleep: 'flexible', wake: 'moderate', clean: 4, game: 'none', music: 'headphones', sports: ['Yoga'], lang: ['Hindi', 'English'], tags: ['Friendly', 'Helpful'] },
      { name: 'Rita Biswas', email: 'rita@gmail.com', cgpa: 6.9, batch: '2021', branch: 'CE', region: 'East', floorPref: 'First Floor', year: 3, category: 'SC_ST', sleep: 'flexible', wake: 'moderate', clean: 2, game: 'casual', music: 'headphones', sports: ['Reading'], lang: ['Bengali', 'English'], tags: ['Quiet', 'Chill'] },
      { name: 'Sita Ramaswamy', email: 'sita@gmail.com', cgpa: 9.7, batch: '2020', branch: 'CSE', region: 'South', floorPref: 'Ground Floor', year: 4, category: 'General', sleep: 'early_bird', wake: 'early', clean: 5, hasDisability: true, game: 'none', music: 'none', sports: ['Chess'], lang: ['Tamil', 'Sanskrit'], tags: ['Introvert', 'Academic'] },
    ];

    const seededUserMap = {};

    for (let raw of studentsRaw) {
      const user = await User.create({
        name: raw.name,
        email: raw.email,
        password: 'password123',
        role: 'Student',
      });

      seededUserMap[raw.name] = user._id;

      await StudentProfile.create({
        userId: user._id,
        cgpa: raw.cgpa,
        batch: raw.batch,
        branch: raw.branch,
        region: raw.region,
        floorPreference: raw.floorPref,
        academicYear: raw.year,
        category: raw.category,
        hasDisability: raw.hasDisability || false,
        roommateCompatibilityProfile: {
          sleepSchedule: raw.sleep,
          wakeTime: raw.wake,
          cleanlinessRating: raw.clean,
          studyHabit: 'flexible',
          introvertExtrovertScale: 3,
          gamingHabit: raw.game,
          musicPreference: raw.music,
          sportsInterests: raw.sports,
          languagesSpoken: raw.lang,
          personalityTags: raw.tags,
        },
        preferredRoommates: [],
      });
    }

    // Set up roommate preferences to show mutual vs single preferences logic
    // Rahul prefers Aryan
    const rahulProfile = await StudentProfile.findOne({ userId: seededUserMap['Rahul Sharma'] });
    rahulProfile.preferredRoommates.push(seededUserMap['Aryan Mehta']);
    await rahulProfile.save();

    // Aryan prefers Rahul (Mutual)
    const aryanProfile = await StudentProfile.findOne({ userId: seededUserMap['Aryan Mehta'] });
    aryanProfile.preferredRoommates.push(seededUserMap['Rahul Sharma']);
    await aryanProfile.save();

    // Aman prefers Rohan (Mutual)
    const amanProfile = await StudentProfile.findOne({ userId: seededUserMap['Aman Patel'] });
    amanProfile.preferredRoommates.push(seededUserMap['Rohan Deshmukh']);
    await amanProfile.save();

    // Rohan prefers Aman (Mutual)
    const rohanProfile = await StudentProfile.findOne({ userId: seededUserMap['Rohan Deshmukh'] });
    rohanProfile.preferredRoommates.push(seededUserMap['Aman Patel']);
    await rohanProfile.save();

    // Priya prefers Neha
    const priyaProfile = await StudentProfile.findOne({ userId: seededUserMap['Priya Iyer'] });
    priyaProfile.preferredRoommates.push(seededUserMap['Neha Gupta']);
    await priyaProfile.save();

    // Neha prefers Priya (Mutual)
    const nehaProfile = await StudentProfile.findOne({ userId: seededUserMap['Neha Gupta'] });
    nehaProfile.preferredRoommates.push(seededUserMap['Priya Iyer']);
    await nehaProfile.save();

    // Seed a couple of complaints to test Conflict Avoidance
    // Kabir complains about Vikram (Smoking/Noise issue)
    await Complaint.create({
      reporterId: seededUserMap['Kabir Kapoor'],
      accusedId: seededUserMap['Vikram Singh'],
      type: 'Noise',
      severity: 'High',
      description: 'Vikram plays music late at night causing disturbance.',
      status: 'Open',
    });

    // Ananya complains about Sneha (Cleanliness issue)
    await Complaint.create({
      reporterId: seededUserMap['Ananya Rao'],
      accusedId: seededUserMap['Sneha Nair'],
      type: 'Cleanliness',
      severity: 'Medium',
      description: 'Sneha leaves trash around the room and never cleans up.',
      status: 'Open',
    });

    console.log('Students, Roommate Preferences, and Complaints seeded successfully.');
    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(seedData);
