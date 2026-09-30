import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// ======================================================
// PROFILE FUNCTIONS
// ======================================================

export async function createOrUpdateProfile(
  userId,
  profileData
) {
  const profileRef = doc(db, "users", userId);

  await setDoc(
    profileRef,
    {
      ...profileData,
      userId,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export async function getUserProfile(userId) {
  const profileRef = doc(db, "users", userId);

  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return null;
  }

  return profileSnapshot.data();
}

// ======================================================
// SKILL FUNCTIONS
// ======================================================

export async function createSkill(
  userId,
  skillData
) {
  const skillsRef = collection(db, "skills");

  const skill = {
    ...skillData,
    userId,
    createdAt: serverTimestamp(),
  };

  const document = await addDoc(
    skillsRef,
    skill
  );

  return {
    id: document.id,
    ...skill,
  };
}

export async function getMySkills(userId) {
  const skillsRef = collection(db, "skills");

  const skillsQuery = query(
    skillsRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(
    skillsQuery
  );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  );
}

export async function deleteSkill(
  skillId
) {
  const skillRef = doc(
    db,
    "skills",
    skillId
  );

  await deleteDoc(skillRef);
}

// ======================================================
// PRACTICE SESSION FUNCTIONS
// ======================================================

export async function createPracticeSession(
  userId,
  practiceData
) {
  const practiceRef = collection(
    db,
    "practiceSessions"
  );

  const session = {
    ...practiceData,
    userId,
    createdAt: serverTimestamp(),
  };

  const document = await addDoc(
    practiceRef,
    session
  );

  return {
    id: document.id,
    ...session,
  };
}

export async function getMyPracticeSessions(
  userId
) {
  const practiceRef = collection(
    db,
    "practiceSessions"
  );

  const practiceQuery = query(
    practiceRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(
    practiceQuery
  );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  );
}

export async function deletePracticeSession(
  sessionId
) {
  const sessionRef = doc(
    db,
    "practiceSessions",
    sessionId
  );

  await deleteDoc(sessionRef);
}

// ======================================================
// GOAL FUNCTIONS
// ======================================================

export async function createGoal(
  userId,
  goalData
) {
  const goalsRef = collection(
    db,
    "goals"
  );

  const goal = {
    ...goalData,
    userId,
    currentValue: 0,
    status: "ACTIVE",
    createdAt: serverTimestamp(),
  };

  const document = await addDoc(
    goalsRef,
    goal
  );

  const goalId = document.id;

  // ----------------------------------------------------
  // AUTOMATICALLY CREATE MILESTONES
  // ----------------------------------------------------

  await createMilestonesForGoal({
    goalId,
    userId,
    targetValue: Number(
      goalData.targetValue || 0
    ),
  });

  return {
    id: goalId,
    ...goal,
  };
}

export async function getMyGoals(userId) {
  const goalsRef = collection(
    db,
    "goals"
  );

  const goalsQuery = query(
    goalsRef,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(
    goalsQuery
  );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  );
}

export async function updateGoal(
  goalId,
  goalData
) {
  const goalRef = doc(
    db,
    "goals",
    goalId
  );

  await updateDoc(
    goalRef,
    goalData
  );
}

export async function deleteGoal(
  goalId
) {
  // ----------------------------------------------------
  // DELETE RELATED MILESTONES FIRST
  // ----------------------------------------------------

  const milestonesRef = collection(
    db,
    "milestones"
  );

  const milestoneQuery = query(
    milestonesRef,
    where("goalId", "==", goalId)
  );

  const milestoneSnapshot =
    await getDocs(milestoneQuery);

  for (
    const milestoneDocument of
      milestoneSnapshot.docs
  ) {
    await deleteDoc(
      doc(
        db,
        "milestones",
        milestoneDocument.id
      )
    );
  }

  // ----------------------------------------------------
  // DELETE GOAL
  // ----------------------------------------------------

  const goalRef = doc(
    db,
    "goals",
    goalId
  );

  await deleteDoc(goalRef);
}

// ======================================================
// MILESTONE FUNCTIONS
// ======================================================

export async function createMilestonesForGoal({
  goalId,
  userId,
  targetValue,
}) {
  const milestonesRef = collection(
    db,
    "milestones"
  );

  const numericTarget =
    Number(targetValue || 0);

  if (numericTarget <= 0) {
    return [];
  }

  // ----------------------------------------------------
  // DEFAULT MILESTONE PERCENTAGES
  // ----------------------------------------------------

  const percentages = [
    25,
    50,
    75,
    100,
  ];

  const createdMilestones = [];

  for (
    const percentage of percentages
  ) {
    const target =
      Math.ceil(
        (numericTarget *
          percentage) /
          100
      );

    // Avoid duplicate target values
    // for very small goals.
    const existingQuery =
      query(
        milestonesRef,
        where(
          "goalId",
          "==",
          goalId
        ),
        where(
          "targetValue",
          "==",
          target
        )
      );

    const existingSnapshot =
      await getDocs(
        existingQuery
      );

    if (
      !existingSnapshot.empty
    ) {
      continue;
    }

    const milestone = {
      goalId,
      userId,
      title:
        percentage === 100
          ? "Goal Completed"
          : `${target} Hours Milestone`,
      targetValue: target,
      percentage,
      achieved: false,
      achievedAt: null,
      createdAt:
        serverTimestamp(),
    };

    const document =
      await addDoc(
        milestonesRef,
        milestone
      );

    createdMilestones.push({
      id: document.id,
      ...milestone,
    });
  }

  return createdMilestones;
}

// ======================================================
// GET MILESTONES
// ======================================================

export async function getGoalMilestones(
  goalId
) {
  const milestonesRef =
    collection(
      db,
      "milestones"
    );

  const milestonesQuery =
    query(
      milestonesRef,
      where(
        "goalId",
        "==",
        goalId
      )
    );

  const snapshot =
    await getDocs(
      milestonesQuery
    );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  );
}

// ======================================================
// GET ALL USER MILESTONES
// ======================================================

export async function getMyMilestones(
  userId
) {
  const milestonesRef =
    collection(
      db,
      "milestones"
    );

  const milestonesQuery =
    query(
      milestonesRef,
      where(
        "userId",
        "==",
        userId
      )
    );

  const snapshot =
    await getDocs(
      milestonesQuery
    );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  );
}

// ======================================================
// CHECK & UPDATE MILESTONES
// ======================================================

export async function updateMilestonesForGoal(
  goalId,
  currentValue
) {
  const milestones =
    await getGoalMilestones(
      goalId
    );

  const numericCurrent =
    Number(
      currentValue || 0
    );

  const newlyAchieved = [];

  for (
    const milestone of milestones
  ) {
    const target =
      Number(
        milestone.targetValue ||
          0
      );

    // --------------------------------------------------
    // ACHIEVE MILESTONE
    // --------------------------------------------------

    if (
      numericCurrent >= target &&
      !milestone.achieved
    ) {
      await updateDoc(
        doc(
          db,
          "milestones",
          milestone.id
        ),
        {
          achieved: true,
          achievedAt:
            serverTimestamp(),
        }
      );

      newlyAchieved.push(
        milestone.id
      );
    }

    // --------------------------------------------------
    // SAFETY: RESET IF CURRENT VALUE DROPS
    // --------------------------------------------------

    if (
      numericCurrent < target &&
      milestone.achieved
    ) {
      await updateDoc(
        doc(
          db,
          "milestones",
          milestone.id
        ),
        {
          achieved: false,
          achievedAt: null,
        }
      );
    }
  }

  return newlyAchieved;
}

// ======================================================
// GOAL PROGRESS UPDATE
// ======================================================

export async function updateGoalsFromPractice(
  userId,
  skillId
) {
  const [
    goals,
    sessions,
  ] = await Promise.all([
    getMyGoals(userId),
    getMyPracticeSessions(
      userId
    ),
  ]);

  const skillSessions =
    sessions.filter(
      (session) =>
        session.skillId ===
        skillId
    );

  const totalMinutes =
    skillSessions.reduce(
      (total, session) =>
        total +
        Number(
          session.durationMinutes ||
            0
        ),
      0
    );

  const totalHours =
    totalMinutes / 60;

  const skillGoals =
    goals.filter(
      (goal) =>
        goal.skillId ===
        skillId
    );

  for (
    const goal of skillGoals
  ) {
    const targetValue =
      Number(
        goal.targetValue || 0
      );

    const currentValue =
      Math.min(
        totalHours,
        targetValue
      );

    const status =
      currentValue >=
      targetValue
        ? "COMPLETED"
        : "ACTIVE";

    // --------------------------------------------------
    // UPDATE GOAL
    // --------------------------------------------------

    await updateGoal(
      goal.id,
      {
        currentValue,
        status,
        updatedAt:
          serverTimestamp(),
      }
    );

    // --------------------------------------------------
    // UPDATE MILESTONES
    // --------------------------------------------------

    await updateMilestonesForGoal(
      goal.id,
      currentValue
    );
  }
}