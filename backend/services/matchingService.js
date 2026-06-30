const StudentProfile = require('../models/StudentProfile');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Hostel = require('../models/Hostel');

/**
 * Calculates Conflict Risk Score and category for a student based on unresolved complaints
 */
const getConflictRisk = async (userId) => {
  const unresolvedComplaints = await Complaint.find({ accusedId: userId, status: 'Open' });
  
  let score = 0;
  unresolvedComplaints.forEach(complaint => {
    if (complaint.severity === 'High') score += 50;
    else if (complaint.severity === 'Medium') score += 25;
    else if (complaint.severity === 'Low') score += 10;
  });

  let category = 'Low Risk';
  if (score >= 40) category = 'High Risk';
  else if (score >= 15) category = 'Medium Risk';

  return { score, category };
};

/**
 * Calculates a roommate compatibility score between 0 and 100
 */
const calculateCompatibilityScore = (profA, profB) => {
  if (!profA || !profB) return 50; // Fallback default

  const sleepA = profA.sleepSchedule || 'flexible';
  const sleepB = profB.sleepSchedule || 'flexible';
  const wakeA = profA.wakeTime || 'moderate';
  const wakeB = profB.wakeTime || 'moderate';
  const cleanA = profA.cleanlinessRating !== undefined ? profA.cleanlinessRating : 3;
  const cleanB = profB.cleanlinessRating !== undefined ? profB.cleanlinessRating : 3;
  const studyA = profA.studyHabit || 'flexible';
  const studyB = profB.studyHabit || 'flexible';
  const ieA = profA.introvertExtrovertScale !== undefined ? profA.introvertExtrovertScale : 3;
  const ieB = profB.introvertExtrovertScale !== undefined ? profB.introvertExtrovertScale : 3;
  const gameA = profA.gamingHabit || 'none';
  const gameB = profB.gamingHabit || 'none';
  const musicA = profA.musicPreference || 'headphones';
  const musicB = profB.musicPreference || 'headphones';

  let score = 0;

  // 1. Sleep Schedule (Max 20 points)
  if (sleepA === sleepB) {
    score += 20;
  } else if (sleepA === 'flexible' || sleepB === 'flexible') {
    score += 15;
  }

  // 2. Wake Time (Max 20 points)
  if (wakeA === wakeB) {
    score += 20;
  } else {
    const isAdjacent = (wakeA === 'early' && wakeB === 'moderate') ||
                      (wakeA === 'moderate' && wakeB === 'early') ||
                      (wakeA === 'moderate' && wakeB === 'late') ||
                      (wakeA === 'late' && wakeB === 'moderate');
    if (isAdjacent) {
      score += 15;
    }
  }

  // 3. Cleanliness Rating 1-5 (Max 20 points)
  const cleanDiff = Math.abs(cleanA - cleanB);
  score += Math.max(0, 20 - 5 * cleanDiff);

  // 4. Study Habit (Max 10 points)
  if (studyA === studyB) {
    score += 10;
  } else if (studyA === 'flexible' || studyB === 'flexible') {
    score += 5;
  }

  // 5. Introvert/Extrovert Scale 1-5 (Max 10 points)
  const ieDiff = Math.abs(ieA - ieB);
  score += Math.max(0, 10 - 2.5 * ieDiff);

  // 6. Gaming Habit (Max 10 points)
  if (gameA === gameB) {
    score += 10;
  } else if (gameA === 'casual' || gameB === 'casual') {
    score += 5;
  }

  // 7. Music Preference (Max 10 points)
  if (musicA === musicB) {
    score += 10;
  } else if (musicA !== 'speakers' && musicB !== 'speakers') {
    score += 5;
  }

  return Math.round(score);
};

// Helper: Determine target room capacity by academic year
const getTargetCapacity = (year) => {
  if (year === 1) return 3; // 1st Year: 3-sharing
  if (year === 4) return 1; // 4th Year: Single room
  return 2; // 2nd/3rd Year: 2-sharing
};

/**
 * Runs Graph-Based Roommate Matching & Room Allocation with Year Constraints
 */
const runRoommateAllocation = async () => {
  // Reset room and roommate assignments first (Must run BEFORE querying documents into memory)
  await Room.updateMany({}, { currentOccupants: [] });
  await StudentProfile.updateMany({ status: 'Allocated' }, { allocatedRoomId: null });

  // 1. Fetch all allocated students and pre-calculate conflict risks
  const allStudents = await StudentProfile.find({ status: 'Allocated' }).populate('userId');
  const students = allStudents.filter(s => s.userId);
  const studentRisks = {};
  
  for (let student of students) {
    const risk = await getConflictRisk(student.userId._id);
    studentRisks[student.userId._id.toString()] = risk;
  }

  // Fetch all rooms
  const rooms = await Room.find();

  let totalMatched = 0;

  // Group students by allocated hostel
  const hostelGroups = {};
  students.forEach(student => {
    if (!student.allocatedHostelId) return;
    const hId = student.allocatedHostelId.toString();
    if (!hostelGroups[hId]) hostelGroups[hId] = [];
    hostelGroups[hId].push(student);
  });

  // Process matching for each Hostel group separately
  for (let hostelId in hostelGroups) {
    const group = hostelGroups[hostelId];
    const hostelRooms = rooms.filter(r => r.hostelId.toString() === hostelId);

    // Segment students by their required capacities (1st Year -> 3, 4th Year -> 1, others -> 2)
    const capacity1Students = group.filter(s => getTargetCapacity(s.academicYear) === 1);
    const capacity2Students = group.filter(s => getTargetCapacity(s.academicYear) === 2);
    const capacity3Students = group.filter(s => getTargetCapacity(s.academicYear) === 3);

    // Get rooms by capacity
    const roomsCap1 = hostelRooms.filter(r => r.capacity === 1);
    const roomsCap2 = hostelRooms.filter(r => r.capacity === 2);
    const roomsCap3 = hostelRooms.filter(r => r.capacity === 3);

    // ==========================================
    // CASE 1: 4th Year Students (Capacity 1 Rooms)
    // ==========================================
    // No roommate matching needed. Place them directly.
    let r1Idx = 0;
    for (let student of capacity1Students) {
      if (r1Idx < roomsCap1.length) {
        const room = roomsCap1[r1Idx];
        room.currentOccupants.push(student.userId._id);
        await room.save();

        student.allocatedRoomId = room._id;
        await student.save();
        
        totalMatched++;
        r1Idx++;
      } else {
        // Fallback: search any other room with capacity 1
        console.log(`No capacity 1 room left for student ${student.userId.name}`);
      }
    }

    // ==========================================
    // CASE 2: 2nd/3rd Year Students (Capacity 2 Rooms)
    // ==========================================
    // Step A: Build weighted graph edges for capacity 2 students
    const edges2 = [];
    for (let i = 0; i < capacity2Students.length; i++) {
      for (let j = i + 1; j < capacity2Students.length; j++) {
        const studentA = capacity2Students[i];
        const studentB = capacity2Students[j];
        const idA = studentA.userId._id.toString();
        const idB = studentB.userId._id.toString();

        let comp = calculateCompatibilityScore(
          studentA.roommateCompatibilityProfile,
          studentB.roommateCompatibilityProfile
        );

        // Conflict checks
        const hasDirectConflict = await Complaint.exists({
          $or: [
            { reporterId: studentA.userId._id, accusedId: studentB.userId._id },
            { reporterId: studentB.userId._id, accusedId: studentA.userId._id }
          ]
        });

        const isAHighRisk = studentRisks[idA] && studentRisks[idA].category === 'High Risk';
        const isBHighRisk = studentRisks[idB] && studentRisks[idB].category === 'High Risk';

        if (hasDirectConflict || (isAHighRisk && isBHighRisk)) {
          continue;
        }

        // Roommate preferences
        const prefA = studentA.preferredRoommates || [];
        const prefB = studentB.preferredRoommates || [];
        const aPrefersB = prefA.map(id => id ? id.toString() : '').filter(Boolean).includes(idB);
        const bPrefersA = prefB.map(id => id ? id.toString() : '').filter(Boolean).includes(idA);

        let weight = comp;
        if (aPrefersB && bPrefersA) weight += 50;
        else if (aPrefersB || bPrefersA) weight += 20;

        weight = Math.min(100, weight);
        edges2.push({ u: studentA, v: studentB, weight });
      }
    }

    // Run Greedy Matching
    edges2.sort((a, b) => b.weight - a.weight);
    const paired2 = new Set();
    const matches2 = [];

    for (let edge of edges2) {
      const uId = edge.u.userId._id.toString();
      const vId = edge.v.userId._id.toString();

      if (!paired2.has(uId) && !paired2.has(vId)) {
        paired2.add(uId);
        paired2.add(vId);
        matches2.push([edge.u, edge.v]);
      }
    }

    // Remaining capacity 2 singles
    const singles2 = capacity2Students.filter(s => !paired2.has(s.userId._id.toString()));
    const pairedSingles2 = new Set();
    for (let i = 0; i < singles2.length; i++) {
      const sA = singles2[i];
      const sAId = sA.userId._id.toString();
      if (pairedSingles2.has(sAId)) continue;

      let bestPartner = null;
      let maxScore = -1;

      for (let j = i + 1; j < singles2.length; j++) {
        const sB = singles2[j];
        const sBId = sB.userId._id.toString();
        if (pairedSingles2.has(sBId)) continue;

        if (studentRisks[sAId].category === 'High Risk' && studentRisks[sBId].category === 'High Risk') continue;

        const comp = calculateCompatibilityScore(sA.roommateCompatibilityProfile, sB.roommateCompatibilityProfile);
        if (comp > maxScore) {
          maxScore = comp;
          bestPartner = sB;
        }
      }

      if (bestPartner) {
        pairedSingles2.add(sAId);
        pairedSingles2.add(bestPartner.userId._id.toString());
        matches2.push([sA, bestPartner]);
      }
    }

    const trueSingles2 = singles2.filter(s => !pairedSingles2.has(s.userId._id.toString()));

    // Place pairs in capacity 2 rooms
    let r2Idx = 0;
    for (let pair of matches2) {
      if (r2Idx < roomsCap2.length) {
        const room = roomsCap2[r2Idx];
        room.currentOccupants.push(pair[0].userId._id, pair[1].userId._id);
        await room.save();

        pair[0].allocatedRoomId = room._id;
        pair[1].allocatedRoomId = room._id;
        await pair[0].save();
        await pair[1].save();

        totalMatched += 2;
        r2Idx++;
      } else {
        trueSingles2.push(pair[0], pair[1]);
      }
    }

    // Place remaining singles
    for (let student of trueSingles2) {
      let allocatedRoom = null;
      for (let room of roomsCap2) {
        if (room.currentOccupants.length < room.capacity) {
          // Avoid conflict checks
          let hasConflict = false;
          for (let occupantId of room.currentOccupants) {
            const complaint = await Complaint.exists({
              $or: [
                { reporterId: student.userId._id, accusedId: occupantId },
                { reporterId: occupantId, accusedId: student.userId._id }
              ]
            });
            const isStudentHighRisk = studentRisks[student.userId._id.toString()] && studentRisks[student.userId._id.toString()].category === 'High Risk';
            const isOccupantHighRisk = studentRisks[occupantId.toString()] && studentRisks[occupantId.toString()].category === 'High Risk';
            if (complaint || (isStudentHighRisk && isOccupantHighRisk)) {
              hasConflict = true;
              break;
            }
          }
          if (!hasConflict) {
            allocatedRoom = room;
            break;
          }
        }
      }

      if (allocatedRoom) {
        allocatedRoom.currentOccupants.push(student.userId._id);
        await allocatedRoom.save();

        student.allocatedRoomId = allocatedRoom._id;
        await student.save();
        totalMatched++;
      }
    }

    // ==========================================
    // CASE 3: 1st Year Students (Capacity 3 Rooms)
    // ==========================================
    // Step A: Build edges for capacity 3 students
    const edges3 = [];
    for (let i = 0; i < capacity3Students.length; i++) {
      for (let j = i + 1; j < capacity3Students.length; j++) {
        const studentA = capacity3Students[i];
        const studentB = capacity3Students[j];
        const idA = studentA.userId._id.toString();
        const idB = studentB.userId._id.toString();

        let comp = calculateCompatibilityScore(
          studentA.roommateCompatibilityProfile,
          studentB.roommateCompatibilityProfile
        );

        const hasDirectConflict = await Complaint.exists({
          $or: [
            { reporterId: studentA.userId._id, accusedId: studentB.userId._id },
            { reporterId: studentB.userId._id, accusedId: studentA.userId._id }
          ]
        });

        const isAHighRisk = studentRisks[idA] && studentRisks[idA].category === 'High Risk';
        const isBHighRisk = studentRisks[idB] && studentRisks[idB].category === 'High Risk';

        if (hasDirectConflict || (isAHighRisk && isBHighRisk)) {
          continue;
        }

        const prefA = studentA.preferredRoommates || [];
        const prefB = studentB.preferredRoommates || [];
        const aPrefersB = prefA.map(id => id ? id.toString() : '').filter(Boolean).includes(idB);
        const bPrefersA = prefB.map(id => id ? id.toString() : '').filter(Boolean).includes(idA);

        let weight = comp;
        if (aPrefersB && bPrefersA) weight += 50;
        else if (aPrefersB || bPrefersA) weight += 20;

        weight = Math.min(100, weight);
        edges3.push({ u: studentA, v: studentB, weight });
      }
    }

    // Run Greedy Matching
    edges3.sort((a, b) => b.weight - a.weight);
    const paired3 = new Set();
    const matches3 = [];

    for (let edge of edges3) {
      const uId = edge.u.userId._id.toString();
      const vId = edge.v.userId._id.toString();

      if (!paired3.has(uId) && !paired3.has(vId)) {
        paired3.add(uId);
        paired3.add(vId);
        matches3.push([edge.u, edge.v]);
      }
    }

    // Remaining capacity 3 singles
    const singles3 = capacity3Students.filter(s => !paired3.has(s.userId._id.toString()));
    const pairedSingles3 = new Set();
    for (let i = 0; i < singles3.length; i++) {
      const sA = singles3[i];
      const sAId = sA.userId._id.toString();
      if (pairedSingles3.has(sAId)) continue;

      let bestPartner = null;
      let maxScore = -1;

      for (let j = i + 1; j < singles3.length; j++) {
        const sB = singles3[j];
        const sBId = sB.userId._id.toString();
        if (pairedSingles3.has(sBId)) continue;

        if (studentRisks[sAId].category === 'High Risk' && studentRisks[sBId].category === 'High Risk') continue;

        const comp = calculateCompatibilityScore(sA.roommateCompatibilityProfile, sB.roommateCompatibilityProfile);
        if (comp > maxScore) {
          maxScore = comp;
          bestPartner = sB;
        }
      }

      if (bestPartner) {
        pairedSingles3.add(sAId);
        pairedSingles3.add(bestPartner.userId._id.toString());
        matches3.push([sA, bestPartner]);
      }
    }

    const trueSingles3 = singles3.filter(s => !pairedSingles3.has(s.userId._id.toString()));

    // Allocate matched pairs to rooms (capacity 3)
    let r3Idx = 0;
    for (let pair of matches3) {
      if (r3Idx < roomsCap3.length) {
        const room = roomsCap3[r3Idx];
        room.currentOccupants.push(pair[0].userId._id, pair[1].userId._id);
        await room.save();

        pair[0].allocatedRoomId = room._id;
        pair[1].allocatedRoomId = room._id;
        await pair[0].save();
        await pair[1].save();

        totalMatched += 2;
        r3Idx++;
      } else {
        trueSingles3.push(pair[0], pair[1]);
      }
    }

    // Allocate remaining singles to rooms (fill the 3rd slot of capacity 3 rooms, or create new configurations)
    for (let student of trueSingles3) {
      let allocatedRoom = null;
      for (let room of roomsCap3) {
        if (room.currentOccupants.length < room.capacity) {
          let hasConflict = false;
          for (let occupantId of room.currentOccupants) {
            const complaint = await Complaint.exists({
              $or: [
                { reporterId: student.userId._id, accusedId: occupantId },
                { reporterId: occupantId, accusedId: student.userId._id }
              ]
            });
            const isStudentHighRisk = studentRisks[student.userId._id.toString()] && studentRisks[student.userId._id.toString()].category === 'High Risk';
            const isOccupantHighRisk = studentRisks[occupantId.toString()] && studentRisks[occupantId.toString()].category === 'High Risk';
            if (complaint || (isStudentHighRisk && isOccupantHighRisk)) {
              hasConflict = true;
              break;
            }
          }
          if (!hasConflict) {
            allocatedRoom = room;
            break;
          }
        }
      }

      if (allocatedRoom) {
        allocatedRoom.currentOccupants.push(student.userId._id);
        await allocatedRoom.save();

        student.allocatedRoomId = allocatedRoom._id;
        await student.save();
        totalMatched++;
      }
    }
  }

  return {
    success: true,
    totalMatchedStudents: totalMatched
  };
};

module.exports = {
  getConflictRisk,
  calculateCompatibilityScore,
  runRoommateAllocation
};
