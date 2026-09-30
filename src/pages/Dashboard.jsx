import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";
import { logoutUser } from "../services/authService";

import {
  getMySkills,
  getMyPracticeSessions,
  getMyGoals,
  getMyMilestones,
} from "../services/firestoreService";

import Navigation from "../components/Navigation";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    skills: 0,
    practiceHours: 0,
    goals: 0,
    completedGoals: 0,
    achievements: 0,
    averageProgress: 0,
  });

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          navigate("/login");
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    if (user) {
      loadDashboardData(user);
    }
  }, [user]);

  async function loadDashboardData(currentUser) {
    try {
      setLoading(true);

      const [
        skills,
        practiceSessions,
        goals,
        milestones,
      ] = await Promise.all([
        getMySkills(currentUser.uid),
        getMyPracticeSessions(currentUser.uid),
        getMyGoals(currentUser.uid),
        getMyMilestones(currentUser.uid),
      ]);

      // =================================================
      // PRACTICE HOURS
      // =================================================

      const totalMinutes =
        practiceSessions.reduce(
          (total, session) =>
            total +
            Number(
              session.durationMinutes || 0
            ),
          0
        );

      const practiceHours = totalMinutes / 60;

      // =================================================
      // GOAL STATISTICS
      // =================================================

      const completedGoals =
        goals.filter(
          (goal) =>
            goal.status === "COMPLETED"
        ).length;

      let averageProgress = 0;

      if (goals.length > 0) {
        const totalProgress =
          goals.reduce(
            (total, goal) => {
              const current = Number(
                goal.currentValue || 0
              );

              const target = Number(
                goal.targetValue || 0
              );

              if (target <= 0) {
                return total;
              }

              const progress = Math.min(
                100,
                (current / target) * 100
              );

              return total + progress;
            },
            0
          );

        averageProgress =
          Math.round(
            totalProgress / goals.length
          );
      }

      // =================================================
      // ACHIEVEMENTS
      // =================================================

      const achievements =
        milestones.filter(
          (milestone) =>
            milestone.achieved === true
        ).length;

      // =================================================
      // UPDATE DASHBOARD
      // =================================================

      setStats({
        skills: skills.length,
        practiceHours,
        goals: goals.length,
        completedGoals,
        achievements,
        averageProgress,
      });

      console.log(
        "DASHBOARD - SKILLS:",
        skills
      );

      console.log(
        "DASHBOARD - PRACTICE:",
        practiceSessions
      );

      console.log(
        "DASHBOARD - GOALS:",
        goals
      );

      console.log(
        "DASHBOARD - MILESTONES:",
        milestones
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    await logoutUser();
    navigate("/login");
  }

  // =====================================================
  // DASHBOARD UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* REUSABLE NAVIGATION */}
        <Navigation />

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1>
              Hobby & Skills Dashboard
            </h1>

            <p style={styles.welcome}>
              Welcome,{" "}
              <strong>
                {user?.email ||
                  auth.currentUser?.email}
              </strong>
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>

        {/* QUICK ACTIONS */}

        <div style={styles.actions}>
          <button
            onClick={() =>
              navigate("/profile")
            }
          >
            👤 My Profile
          </button>

          <button
            onClick={() =>
              navigate("/skills")
            }
          >
            🎯 My Skills
          </button>

          <button
            onClick={() =>
              navigate("/practice")
            }
          >
            ⏱ Practice
          </button>

          <button
            onClick={() =>
              navigate("/goals")
            }
          >
            🏆 Goals
          </button>

          <button
            onClick={() =>
              navigate("/community")
            }
          >
            🌐 Community
          </button>
        </div>

        {/* STATISTICS */}

        <h2 style={styles.sectionTitle}>
          Your Progress
        </h2>

        {loading ? (
          <div style={styles.loading}>
            Loading dashboard...
          </div>
        ) : (
          <div style={styles.grid}>
            <div style={styles.box}>
              <div style={styles.icon}>
                🎯
              </div>

              <h3>Active Skills</h3>

              <p style={styles.number}>
                {stats.skills}
              </p>

              <span style={styles.description}>
                Skills you're tracking
              </span>
            </div>

            <div style={styles.box}>
              <div style={styles.icon}>
                ⏱️
              </div>

              <h3>Practice Hours</h3>

              <p style={styles.number}>
                {stats.practiceHours.toFixed(
                  1
                )}
              </p>

              <span style={styles.description}>
                Total practice time
              </span>
            </div>

            <div style={styles.box}>
              <div style={styles.icon}>
                🎯
              </div>

              <h3>Goals</h3>

              <p style={styles.number}>
                {stats.goals}
              </p>

              <span style={styles.description}>
                {stats.completedGoals} completed
              </span>
            </div>

            <div style={styles.box}>
              <div style={styles.icon}>
                🏆
              </div>

              <h3>Achievements</h3>

              <p style={styles.number}>
                {stats.achievements}
              </p>

              <span style={styles.description}>
                Milestones achieved
              </span>
            </div>
          </div>
        )}

        {/* AVERAGE PROGRESS */}

        {!loading && (
          <div style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <div>
                <h3>
                  Overall Goal Progress
                </h3>

                <p>
                  Average progress across
                  your goals
                </p>
              </div>

              <strong
                style={
                  styles.progressPercentage
                }
              >
                {stats.averageProgress}%
              </strong>
            </div>

            <div
              style={
                styles.progressContainer
              }
            >
              <div
                style={{
                  ...styles.progressBar,
                  width: `${stats.averageProgress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* PROJECT SUMMARY */}

        <div style={styles.infoCard}>
          <h2>
            ☁️ Cloud Hobby & Skills Tracker
          </h2>

          <p>
            Track your skills, record practice
            sessions, create goals, unlock
            milestones, and share your hobbies
            with the community.
          </p>

          <div style={styles.cloudFeatures}>
            <span>🔥 Firebase Auth</span>
            <span>☁️ Cloud Firestore</span>
            <span>📊 Progress Tracking</span>
            <span>🏆 Milestones</span>
            <span>🌐 Community Sharing</span>
          </div>
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

  card: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.06)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  welcome: {
    color: "#64748b",
  },

  logoutButton: {
    width: "auto",
    background: "#dc2626",
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    margin: "30px 0",
  },

  sectionTitle: {
    marginTop: "10px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },

  box: {
    padding: "22px",
    background: "#f1f5f9",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  icon: {
    fontSize: "28px",
    marginBottom: "8px",
  },

  number: {
    fontSize: "30px",
    fontWeight: "700",
    margin: "10px 0 4px",
    color: "#0f172a",
  },

  description: {
    color: "#64748b",
    fontSize: "13px",
  },

  loading: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },

  progressCard: {
    marginTop: "25px",
    padding: "22px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  progressPercentage: {
    fontSize: "24px",
    color: "#2563eb",
  },

  progressContainer: {
    width: "100%",
    height: "12px",
    background: "#e2e8f0",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "15px",
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition: "width 0.4s ease",
  },

  infoCard: {
    marginTop: "30px",
    padding: "24px",
    background: "#eff6ff",
    borderRadius: "12px",
    border: "1px solid #bfdbfe",
  },

  cloudFeatures: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px",
  },
};

export default Dashboard;