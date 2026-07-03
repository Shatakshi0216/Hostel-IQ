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
  if (year === 'BTech 1') return 3; // 1st Year: 3-sharing
  if (year === 'BTech 4' || year === 'PhD') return 1; // 4th Year / PhD: Single room
  return 2; // 2nd/3rd Year/others: 2-sharing
};

const mapFloorPreference = (pref) => {
  if (pref === 'Ground Floor') return 1;
  if (pref === 'First Floor') return 2;
  if (pref === 'Second Floor') return 3;
  return null;
};

/**
 * Runs Graph-Based Roommate Matching & Room Allocation with Year Constraints
 */
const runRoommateAllocation = async (hostelId = null) => {
  // Reset room and roommate assignments first (Must run BEFORE querying documents into memory)
  if (hostelId) {
    await Room.updateMany({ hostelId }, { currentOccupants: [] });
    await StudentProfile.updateMany({ allocatedHostelId: hostelId }, { allocatedRoomId: null });
  } else {
    await Room.updateMany({}, { currentOccupants: [] });
    await StudentProfile.updateMany({ status: 'Allocated' }, { allocatedRoomId: null });
  }

  // 1. Fetch all allocated students and pre-calculate conflict risks
  const query = { status: 'Allocated' };
  if (hostelId) {
    query.allocatedHostelId = hostelId;
  }
  const allStudents = await StudentProfile.find(query).populate('userId');
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
    if (hostelId && hId !== hostelId.toString()) return;
    if (!hostelGroups[hId]) hostelGroups[hId] = [];
    hostelGroups[hId].push(student);
  });

  // Process matching for each Hostel group separately
  for (let hostelId in hostelGroups) {
    const group = hostelGroups[hostelId];
    const hostelRooms = rooms.filter(r => r.hostelId.toString() === hostelId);

    // Segment roommate allocations strictly by academic year cohorts
    const cohorts = ['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD'];

    // Helper: Find an available room that can accommodate a group of a specific cohort
    const findAvailableRoom = async (cohort, groupToPlace, targetCapacity) => {
      const groupSize = groupToPlace.length;
      
      // Determine preferred floor number from the group
      let preferredFloorNum = null;
      for (let s of groupToPlace) {
        if (s.floorPreference && s.floorPreference !== 'No Preference') {
          preferredFloorNum = mapFloorPreference(s.floorPreference);
          if (preferredFloorNum !== null) break;
        }
      }

      // Sort rooms: preferred floor first, then others
      const sortedRooms = [...hostelRooms].sort((a, b) => {
        if (preferredFloorNum !== null) {
          const aPref = a.floor === preferredFloorNum ? 0 : 1;
          const bPref = b.floor === preferredFloorNum ? 0 : 1;
          if (aPref !== bPref) return aPref - bPref;
        }
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });

      for (let room of sortedRooms) {
        const occupied = room.currentOccupants.length;
        const availableBeds = room.capacity - occupied;

        // Must have enough physical beds
        if (availableBeds < groupSize) continue;

        // If the room already has occupants, check cohort and target capacity limits
        if (occupied > 0) {
          const firstOccupantId = room.currentOccupants[0];
          const firstOccupantProfile = await StudentProfile.findOne({ userId: firstOccupantId });
          if (!firstOccupantProfile || firstOccupantProfile.academicYear !== cohort) {
            continue;
          }

          // Cannot exceed the cohort's target room capacity
          if (occupied + groupSize > targetCapacity) {
            continue;
          }
        } else {
          // If empty room, the group size itself cannot exceed target capacity
          if (groupSize > targetCapacity) {
            continue;
          }
        }

        // Verify no conflicts with current occupants
        let hasConflict = false;
        for (let student of groupToPlace) {
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
          if (hasConflict) break;
        }

        if (!hasConflict) {
          return room;
        }
      }
      return null;
    };

    for (let cohort of cohorts) {
      const cohortStudents = group.filter(s => s.academicYear === cohort);
      if (cohortStudents.length === 0) continue;

      const cap = getTargetCapacity(cohort);

      // ==========================================
      // CASE 1: Single Room Cohorts (Capacity 1)
      // ==========================================
      if (cap === 1) {
        for (let student of cohortStudents) {
          const room = await findAvailableRoom(cohort, [student], 1);
          if (room) {
            room.currentOccupants.push(student.userId._id);
            await room.save();

            student.allocatedRoomId = room._id;
            await student.save();
            totalMatched++;
          }
        }
      }

      // ==========================================
      // CASE 2: Double Room Cohorts (Capacity 2)
      // ==========================================
      else if (cap === 2) {
        // Step A: Build weighted graph edges for this cohort
        const edges2 = [];
        for (let i = 0; i < cohortStudents.length; i++) {
          for (let j = i + 1; j < cohortStudents.length; j++) {
            const studentA = cohortStudents[i];
            const studentB = cohortStudents[j];
            const idA = studentA.userId._id.toString();
            const idB = studentB.userId._id.toString();

            const comp = calculateCompatibilityScore(
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
            
            // Branch compatibility bonus (+15)
            if (studentA.branch && studentB.branch && studentA.branch === studentB.branch) {
              weight += 15;
            }
            
            // Home region compatibility bonus (+15)
            if (studentA.region && studentB.region && studentA.region === studentB.region) {
              weight += 15;
            }

            // Roommate preference bonuses (carrying max weight, uncapped)
            if (aPrefersB && bPrefersA) weight += 200;
            else if (aPrefersB || bPrefersA) weight += 100;

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

        // Remaining cohort singles compatibility backup
        const singles2 = cohortStudents.filter(s => !paired2.has(s.userId._id.toString()));
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

            let comp = calculateCompatibilityScore(sA.roommateCompatibilityProfile, sB.roommateCompatibilityProfile);
            
            if (sA.branch && sB.branch && sA.branch === sB.branch) comp += 15;
            if (sA.region && sB.region && sA.region === sB.region) comp += 15;

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
        for (let pair of matches2) {
          const room = await findAvailableRoom(cohort, pair, 2);
          if (room) {
            room.currentOccupants.push(pair[0].userId._id, pair[1].userId._id);
            await room.save();

            pair[0].allocatedRoomId = room._id;
            pair[1].allocatedRoomId = room._id;
            await pair[0].save();
            await pair[1].save();

            totalMatched += 2;
          } else {
            trueSingles2.push(pair[0], pair[1]);
          }
        }

        // Place remaining singles
        for (let student of trueSingles2) {
          const room = await findAvailableRoom(cohort, [student], 2);
          if (room) {
            room.currentOccupants.push(student.userId._id);
            await room.save();

            student.allocatedRoomId = room._id;
            await student.save();
            totalMatched++;
          }
        }
      }

      // ==========================================
      // CASE 3: Triple Room Cohorts (Capacity 3)
      // ==========================================
      else if (cap === 3) {
        // Step A: Build weighted graph edges for this cohort
        const edges3 = [];
        for (let i = 0; i < cohortStudents.length; i++) {
          for (let j = i + 1; j < cohortStudents.length; j++) {
            const studentA = cohortStudents[i];
            const studentB = cohortStudents[j];
            const idA = studentA.userId._id.toString();
            const idB = studentB.userId._id.toString();

            const comp = calculateCompatibilityScore(
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
            
            // Branch compatibility bonus (+15)
            if (studentA.branch && studentB.branch && studentA.branch === studentB.branch) {
              weight += 15;
            }
            
            // Home region compatibility bonus (+15)
            if (studentA.region && studentB.region && studentA.region === studentB.region) {
              weight += 15;
            }

            // Roommate preference bonuses (carrying max weight, uncapped)
            if (aPrefersB && bPrefersA) weight += 200;
            else if (aPrefersB || bPrefersA) weight += 100;

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

        // Remaining cohort singles compatibility backup
        const singles3 = cohortStudents.filter(s => !paired3.has(s.userId._id.toString()));
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

            let comp = calculateCompatibilityScore(sA.roommateCompatibilityProfile, sB.roommateCompatibilityProfile);
            
            if (sA.branch && sB.branch && sA.branch === sB.branch) comp += 15;
            if (sA.region && sB.region && sA.region === sB.region) comp += 15;

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

        // Place pairs in capacity 3 rooms
        for (let pair of matches3) {
          const room = await findAvailableRoom(cohort, pair, 3);
          if (room) {
            room.currentOccupants.push(pair[0].userId._id, pair[1].userId._id);
            await room.save();

            pair[0].allocatedRoomId = room._id;
            pair[1].allocatedRoomId = room._id;
            await pair[0].save();
            await pair[1].save();

            totalMatched += 2;
          } else {
            trueSingles3.push(pair[0], pair[1]);
          }
        }

        // Place remaining singles
        for (let student of trueSingles3) {
          const room = await findAvailableRoom(cohort, [student], 3);
          if (room) {
            room.currentOccupants.push(student.userId._id);
            await room.save();

            student.allocatedRoomId = room._id;
            await student.save();
            totalMatched++;
          }
        }
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
