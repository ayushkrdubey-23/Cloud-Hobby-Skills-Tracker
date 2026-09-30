import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";
import Navigation from "../components/Navigation";

import {
  getMySkills,
  createPracticeSession,
  getMyPracticeSessions,
  deletePracticeSession,
  updateGoalsFromPractice,
} from "../services/firestoreService";

function Practice() {
  const [user, setUser] = useState(null);

  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [form, setForm] = useState({
    skillId: "",
    practiceDate: new Date()
      .toISOString()
      .split("T")[0],
    durationMinutes: "",
    activity: "",
    notes: "",
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
  // LOAD DATA AFTER AUTHENTICATION
  // =====================================================

  async function loadData(currentUser) {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);

      const [userSkills, userSessions] =
        await Promise.all([
          getMySkills(currentUser.uid),
          getMyPracticeSessions(
            currentUser.uid
          ),
        ]);

      console.log(
        "PRACTICE PAGE - USER:",
        currentUser.uid
      );

      console.log(
        "PRACTICE PAGE - SKILLS:",
        userSkills
      );

      setSkills(userSkills);

      const sortedSessions = [
        ...userSessions,
      ].sort(
        (a, b) =>
          new Date(b.practiceDate) -
          new Date(a.practiceDate)
      );

      setSessions(sortedSessions);
    } catch (error) {
      console.error(
        "Practice loading error:",
        error
      );

      setMessage(
        "Unable to load practice data."
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
  // FORM
  // =====================================================

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  // =====================================================
  // CREATE PRACTICE SESSION
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

    if (!form.durationMinutes) {
      setMessage(
        "Please enter practice duration."
      );
      return;
    }

    if (
      Number(form.durationMinutes) <= 0
    ) {
      setMessage(
        "Practice duration must be greater than zero."
      );
      return;
    }

    if (!form.activity.trim()) {
      setMessage(
        "Please enter the activity."
      );
      return;
    }

    try {
      setMessage(
        "Saving practice session..."
      );

      await createPracticeSession(
        user.uid,
        {
          skillId: form.skillId,
          practiceDate:
            form.practiceDate,
          durationMinutes: Number(
            form.durationMinutes
          ),
          activity:
            form.activity.trim(),
          notes: form.notes.trim(),
        }
      );

      await updateGoalsFromPractice(
        user.uid,
        form.skillId
      );

      setForm({
        skillId: form.skillId,
        practiceDate:
          new Date()
            .toISOString()
            .split("T")[0],
        durationMinutes: "",
        activity: "",
        notes: "",
      });

      await loadData(user);

      setMessage(
        "Practice session saved successfully."
      );
    } catch (error) {
      console.error(
        "Practice creation error:",
        error
      );

      setMessage(
        "Unable to save practice session."
      );
    }
  }

  // =====================================================
  // DELETE SESSION
  // =====================================================

  async function handleDelete(
    sessionId
  ) {
    const confirmed = window.confirm(
      "Delete this practice session?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePracticeSession(
        sessionId
      );

      await loadData(user);

      setMessage(
        "Practice session deleted successfully."
      );
    } catch (error) {
      console.error(
        "Practice deletion error:",
        error
      );

      setMessage(
        "Unable to delete practice session."
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

    return (
      skill?.skillName ||
      "Unknown Skill"
    );
  }

  const totalMinutes =
    sessions.reduce(
      (total, session) =>
        total +
        Number(
          session.durationMinutes || 0
        ),
      0
    );

  const totalHours =
    totalMinutes / 60;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Navigation />

        <h1>Practice Tracker</h1>

        <p style={styles.subtitle}>
          Record your practice sessions and
          build consistent habits.
        </p>

        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <h3>Total Practice</h3>

            <strong>
              {totalHours.toFixed(1)} hours
            </strong>
          </div>

          <div style={styles.summaryCard}>
            <h3>Total Sessions</h3>

            <strong>
              {sessions.length}
            </strong>
          </div>
        </div>

        <div style={styles.formCard}>
          <h2>
            Log Practice Session
          </h2>

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

            <label>
              Practice Date
            </label>

            <input
              type="date"
              name="practiceDate"
              value={
                form.practiceDate
              }
              onChange={handleChange}
            />

            <label>
              Duration (minutes)
            </label>

            <input
              type="number"
              name="durationMinutes"
              min="1"
              placeholder="Example: 60"
              value={
                form.durationMinutes
              }
              onChange={handleChange}
            />

            <label>Activity</label>

            <input
              type="text"
              name="activity"
              placeholder="Example: Practiced portrait photography"
              value={form.activity}
              onChange={handleChange}
            />

            <label>Notes</label>

            <textarea
              name="notes"
              rows="4"
              placeholder="What did you learn?"
              value={form.notes}
              onChange={handleChange}
            />

            <button
              type="submit"
              disabled={
                loading ||
                skills.length === 0
              }
            >
              Save Practice Session
            </button>
          </form>

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}
        </div>

        <div
          style={styles.sessionsSection}
        >
          <h2>Recent Practice</h2>

          {loading ? (
            <p>Loading...</p>
          ) : sessions.length === 0 ? (
            <div style={styles.empty}>
              No practice sessions yet.
            </div>
          ) : (
            <div style={styles.list}>
              {sessions.map(
                (session) => (
                  <div
                    key={session.id}
                    style={
                      styles.sessionCard
                    }
                  >
                    <div>
                      <h3>
                        {getSkillName(
                          session.skillId
                        )}
                      </h3>

                      <p>
                        <strong>
                          {
                            session.durationMinutes
                          }
                        </strong>{" "}
                        minutes
                      </p>

                      <p>
                        {
                          session.activity
                        }
                      </p>

                      <p
                        style={
                          styles.date
                        }
                      >
                        {
                          session.practiceDate
                        }
                      </p>

                      {session.notes && (
                        <p
                          style={
                            styles.notes
                          }
                        >
                          {session.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handleDelete(
                          session.id
                        )
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      Delete
                    </button>
                  </div>
                )
              )}
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

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    margin: "25px 0",
  },

  summaryCard: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow:
      "0 6px 20px rgba(0,0,0,0.05)",
  },

  formCard: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.06)",
  },

  sessionsSection: {
    marginTop: "35px",
  },

  list: {
    display: "grid",
    gap: "15px",
  },

  sessionCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.05)",
  },

  date: {
    color: "#64748b",
    fontSize: "14px",
  },

  notes: {
    color: "#475569",
  },

  warning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "10px",
    borderRadius: "8px",
    marginTop: "8px",
  },

  deleteButton: {
    width: "auto",
    height: "fit-content",
    background: "#dc2626",
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

export default Practice;