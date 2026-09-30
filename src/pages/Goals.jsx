import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";
import Navigation from "../components/Navigation";

import {
  getMySkills,
  createGoal,
  getMyGoals,
  deleteGoal,
  getGoalMilestones,
} from "../services/firestoreService";

function Goals() {
  const [user, setUser] = useState(null);

  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [milestones, setMilestones] = useState({});

  const [form, setForm] = useState({
    skillId: "",
    title: "",
    targetValue: "",
    unit: "hours",
    deadline: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // =====================================================
  // WAIT FOR FIREBASE AUTHENTICATION
  // =====================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // LOAD SKILLS, GOALS AND MILESTONES
  // =====================================================

  async function loadData(currentUser) {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);

      const [userSkills, userGoals] =
        await Promise.all([
          getMySkills(currentUser.uid),
          getMyGoals(currentUser.uid),
        ]);

      console.log(
        "GOALS PAGE - USER:",
        currentUser.uid
      );

      console.log(
        "GOALS PAGE - SKILLS:",
        userSkills
      );

      console.log(
        "GOALS PAGE - GOALS:",
        userGoals
      );

      setSkills(userSkills);
      setGoals(userGoals);

      // Load milestones for every goal
      const milestoneResults = {};

      await Promise.all(
        userGoals.map(async (goal) => {
          try {
            const goalMilestones =
              await getGoalMilestones(goal.id);

            milestoneResults[goal.id] =
              goalMilestones;
          } catch (error) {
            console.error(
              `Milestone loading error for goal ${goal.id}:`,
              error
            );

            milestoneResults[goal.id] = [];
          }
        })
      );

      setMilestones(milestoneResults);

      console.log(
        "GOALS PAGE - MILESTONES:",
        milestoneResults
      );
    } catch (error) {
      console.error(
        "Goal loading error:",
        error
      );

      setMessage(
        "Unable to load skills, goals or milestones."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData(user);
    }
  }, [user]);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  // =====================================================
  // CREATE GOAL
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    if (!form.skillId) {
      setMessage("Please select a skill.");
      return;
    }

    if (!form.title.trim()) {
      setMessage("Please enter a goal title.");
      return;
    }

    if (
      !form.targetValue ||
      Number(form.targetValue) <= 0
    ) {
      setMessage(
        "Target value must be greater than zero."
      );
      return;
    }

    try {
      setMessage("Creating goal...");

      await createGoal(user.uid, {
        skillId: form.skillId,
        title: form.title.trim(),
        targetValue: Number(form.targetValue),
        unit: form.unit,
        deadline: form.deadline,
      });

      setForm({
        skillId: "",
        title: "",
        targetValue: "",
        unit: "hours",
        deadline: "",
      });

      await loadData(user);

      setMessage(
        "Goal created successfully."
      );
    } catch (error) {
      console.error(
        "Goal creation error:",
        error
      );

      setMessage(
        "Unable to create goal."
      );
    }
  }

  // =====================================================
  // DELETE GOAL
  // =====================================================

  async function handleDelete(goalId) {
    const confirmed = window.confirm(
      "Delete this goal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGoal(goalId);

      await loadData(user);

      setMessage(
        "Goal deleted successfully."
      );
    } catch (error) {
      console.error(
        "Goal deletion error:",
        error
      );

      setMessage(
        "Unable to delete goal."
      );
    }
  }

  // =====================================================
  // GET SKILL NAME
  // =====================================================

  function getSkillName(skillId) {
    const skill = skills.find(
      (item) => item.id === skillId
    );

    return skill?.skillName || "Unknown Skill";
  }

  // =====================================================
  // CALCULATE PROGRESS
  // =====================================================

  function calculateProgress(goal) {
    const current = Number(
      goal.currentValue || 0
    );

    const target = Number(
      goal.targetValue || 0
    );

    if (target <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (current / target) * 100
      )
    );
  }

  // =====================================================
  // GET MILESTONE PROGRESS
  // =====================================================

  function getMilestoneStats(goalId) {
    const goalMilestones =
      milestones[goalId] || [];

    const achievedCount =
      goalMilestones.filter(
        (milestone) => milestone.achieved
      ).length;

    return {
      total: goalMilestones.length,
      achieved: achievedCount,
    };
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Navigation />
        
        <h1>Goals & Milestones</h1>

        <p style={styles.subtitle}>
          Set measurable goals and track your
          progress automatically.
        </p>

        {/* =====================================================
            CREATE GOAL
        ===================================================== */}

        <div style={styles.formCard}>
          <h2>Create Goal</h2>

          <form onSubmit={handleSubmit}>
            <label>Skill</label>

            <select
              name="skillId"
              value={form.skillId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">
                {loading
                  ? "Loading skills..."
                  : "Select a skill"}
              </option>

              {skills.map((skill) => (
                <option
                  key={skill.id}
                  value={skill.id}
                >
                  {skill.skillName}
                </option>
              ))}
            </select>

            {!loading &&
              skills.length === 0 && (
                <p style={styles.warning}>
                  No skills found. Go to
                  <strong> My Skills </strong>
                  and create a skill first.
                </p>
              )}

            <label>Goal Title</label>

            <input
              type="text"
              name="title"
              placeholder="Example: Practice Photography"
              value={form.title}
              onChange={handleChange}
            />

            <label>Target Value</label>

            <input
              type="number"
              name="targetValue"
              min="1"
              placeholder="Example: 20"
              value={form.targetValue}
              onChange={handleChange}
            />

            <label>Unit</label>

            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
            >
              <option value="hours">
                Hours
              </option>

              <option value="sessions">
                Sessions
              </option>
            </select>

            <label>Deadline</label>

            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
            />

            <button
              type="submit"
              disabled={
                loading || skills.length === 0
              }
            >
              Create Goal
            </button>
          </form>

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}
        </div>

        {/* =====================================================
            MY GOALS
        ===================================================== */}

        <div style={styles.goalsSection}>
          <h2>My Goals</h2>

          {loading ? (
            <p>Loading goals...</p>
          ) : goals.length === 0 ? (
            <div style={styles.empty}>
              <p>No goals created yet.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {goals.map((goal) => {
                const progress =
                  calculateProgress(goal);

                const milestoneStats =
                  getMilestoneStats(goal.id);

                const goalMilestones =
                  milestones[goal.id] || [];

                return (
                  <div
                    key={goal.id}
                    style={styles.goalCard}
                  >
                    {/* GOAL HEADER */}

                    <div
                      style={
                        styles.goalHeader
                      }
                    >
                      <div>
                        <h3>
                          {goal.title}
                        </h3>

                        <p
                          style={
                            styles.skillName
                          }
                        >
                          {getSkillName(
                            goal.skillId
                          )}
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.status,
                          background:
                            goal.status ===
                            "COMPLETED"
                              ? "#dcfce7"
                              : "#dbeafe",
                          color:
                            goal.status ===
                            "COMPLETED"
                              ? "#166534"
                              : "#1d4ed8",
                        }}
                      >
                        {goal.status}
                      </span>
                    </div>

                    {/* GOAL PROGRESS */}

                    <div
                      style={
                        styles.progressContainer
                      }
                    >
                      <div
                        style={{
                          ...styles.progressBar,
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div
                      style={
                        styles.progressText
                      }
                    >
                      <span>
                        {Number(
                          goal.currentValue ||
                            0
                        ).toFixed(1)}{" "}
                        /{" "}
                        {goal.targetValue}{" "}
                        {goal.unit}
                      </span>

                      <strong>
                        {progress}%
                      </strong>
                    </div>

                    {/* MILESTONE SECTION */}

                    <div
                      style={
                        styles.milestoneSection
                      }
                    >
                      <div
                        style={
                          styles.milestoneHeader
                        }
                      >
                        <h4>
                          🏆 Milestones
                        </h4>

                        <span
                          style={
                            styles.milestoneCount
                          }
                        >
                          {
                            milestoneStats.achieved
                          }{" "}
                          /{" "}
                          {
                            milestoneStats.total
                          }
                        </span>
                      </div>

                      {goalMilestones.length ===
                      0 ? (
                        <p
                          style={
                            styles.noMilestones
                          }
                        >
                          No milestones available.
                        </p>
                      ) : (
                        <div
                          style={
                            styles.milestoneList
                          }
                        >
                          {goalMilestones
                            .sort(
                              (a, b) =>
                                Number(
                                  a.targetValue
                                ) -
                                Number(
                                  b.targetValue
                                )
                            )
                            .map(
                              (
                                milestone
                              ) => (
                                <div
                                  key={
                                    milestone.id
                                  }
                                  style={{
                                    ...styles.milestoneItem,
                                    background:
                                      milestone.achieved
                                        ? "#f0fdf4"
                                        : "#f8fafc",
                                    border:
                                      milestone.achieved
                                        ? "1px solid #86efac"
                                        : "1px solid #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={
                                      styles.milestoneIcon
                                    }
                                  >
                                    {milestone.achieved
                                      ? "🏆"
                                      : "🔒"}
                                  </div>

                                  <div
                                    style={
                                      styles.milestoneInfo
                                    }
                                  >
                                    <strong>
                                      {
                                        milestone.title
                                      }
                                    </strong>

                                    <span
                                      style={
                                        styles.milestoneTarget
                                      }
                                    >
                                      {
                                        milestone.targetValue
                                      }{" "}
                                      {
                                        goal.unit
                                      }{" "}
                                      •{" "}
                                      {
                                        milestone.percentage
                                      }
                                      %
                                    </span>
                                  </div>

                                  <span
                                    style={{
                                      ...styles.milestoneStatus,
                                      color:
                                        milestone.achieved
                                          ? "#15803d"
                                          : "#64748b",
                                    }}
                                  >
                                    {milestone.achieved
                                      ? "Achieved"
                                      : "Locked"}
                                  </span>
                                </div>
                              )
                            )}
                        </div>
                      )}
                    </div>

                    {/* MILESTONE SUMMARY */}

                    {milestoneStats.total > 0 && (
                      <div
                        style={
                          styles.achievementBox
                        }
                      >
                        {milestoneStats.achieved ===
                        milestoneStats.total ? (
                          <span>
                            🎉 All milestones
                            achieved!
                          </span>
                        ) : (
                          <span>
                            ⭐{" "}
                            {
                              milestoneStats.achieved
                            }{" "}
                            milestone
                            {milestoneStats.achieved !==
                            1
                              ? "s"
                              : ""}{" "}
                            achieved
                          </span>
                        )}
                      </div>
                    )}

                    {/* DEADLINE */}

                    {goal.deadline && (
                      <p
                        style={
                          styles.deadline
                        }
                      >
                        Deadline:{" "}
                        {goal.deadline}
                      </p>
                    )}

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        handleDelete(
                          goal.id
                        )
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      Delete Goal
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  subtitle: {
    color: "#64748b",
  },

  formCard: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.06)",
    marginTop: "25px",
  },

  goalsSection: {
    marginTop: "35px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  goalCard: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow:
      "0 6px 20px rgba(0,0,0,0.05)",
  },

  goalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  skillName: {
    color: "#64748b",
  },

  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  progressContainer: {
    width: "100%",
    height: "12px",
    background: "#e2e8f0",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "20px",
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },

  progressText: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },

  milestoneSection: {
    marginTop: "22px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
  },

  milestoneHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  milestoneHeaderTitle: {
    margin: 0,
  },

  milestoneCount: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "4px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  milestoneList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  milestoneItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "10px",
  },

  milestoneIcon: {
    fontSize: "20px",
    width: "28px",
    textAlign: "center",
  },

  milestoneInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    flex: 1,
    minWidth: 0,
  },

  milestoneTarget: {
    color: "#64748b",
    fontSize: "12px",
  },

  milestoneStatus: {
    fontSize: "11px",
    fontWeight: "600",
  },

  noMilestones: {
    color: "#64748b",
    fontSize: "14px",
  },

  achievementBox: {
    marginTop: "12px",
    padding: "10px 12px",
    background: "#fefce8",
    color: "#854d0e",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
  },

  deadline: {
    color: "#64748b",
    fontSize: "14px",
  },

  deleteButton: {
    background: "#dc2626",
    marginTop: "15px",
  },

  warning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "10px",
    borderRadius: "8px",
    marginTop: "8px",
  },

  message: {
    marginTop: "20px",
    padding: "12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
  },

  empty: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
  },
};

export default Goals;