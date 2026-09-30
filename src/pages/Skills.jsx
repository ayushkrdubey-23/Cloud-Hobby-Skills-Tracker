import { useEffect, useState } from "react";
import { auth } from "../firebase";
import Navigation from "../components/Navigation";

import {
  createSkill,
  getMySkills,
  deleteSkill,
} from "../services/firestoreService";

function Skills() {
  const user = auth.currentUser;

  const [skills, setSkills] = useState([]);

  const [form, setForm] = useState({
    skillName: "",
    category: "Other",
    currentLevel: "BEGINNER",
    targetLevel: "INTERMEDIATE",
    status: "ACTIVE",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSkills() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userSkills = await getMySkills(user.uid);

      setSkills(userSkills);
    } catch (error) {
      console.error("Error loading skills:", error);

      setMessage(
        "Unable to load skills. Check Firestore permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    if (!form.skillName.trim()) {
      setMessage("Please enter a skill name.");
      return;
    }

    try {
      setMessage("Creating skill...");

      await createSkill(user.uid, {
        skillName: form.skillName.trim(),
        category: form.category,
        currentLevel: form.currentLevel,
        targetLevel: form.targetLevel,
        status: form.status,
        description: form.description.trim(),
      });

      setForm({
        skillName: "",
        category: "Other",
        currentLevel: "BEGINNER",
        targetLevel: "INTERMEDIATE",
        status: "ACTIVE",
        description: "",
      });

      await loadSkills();

      setMessage("Skill created successfully.");
    } catch (error) {
      console.error("Error creating skill:", error);

      setMessage(
        "Unable to create skill. Check the browser console."
      );
    }
  }

  async function handleDelete(skillId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this skill?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSkill(skillId);

      await loadSkills();

      setMessage("Skill deleted successfully.");
    } catch (error) {
      console.error("Error deleting skill:", error);

      setMessage("Unable to delete skill.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Navigation />

        <h1>My Skills</h1>

        <p style={styles.subtitle}>
          Add and manage the hobbies and skills you
          want to improve.
        </p>

        {/* CREATE SKILL */}

        <div style={styles.formCard}>
          <h2>Add New Skill</h2>

          <form onSubmit={handleSubmit}>
            <label>Skill Name</label>

            <input
              type="text"
              name="skillName"
              placeholder="Example: Photography"
              value={form.skillName}
              onChange={handleChange}
            />

            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="Coding">
                Coding
              </option>

              <option value="Music">
                Music
              </option>

              <option value="Art">
                Art
              </option>

              <option value="Fitness">
                Fitness
              </option>

              <option value="Language">
                Language
              </option>

              <option value="Cooking">
                Cooking
              </option>

              <option value="Photography">
                Photography
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <label>Current Level</label>

            <select
              name="currentLevel"
              value={form.currentLevel}
              onChange={handleChange}
            >
              <option value="BEGINNER">
                BEGINNER
              </option>

              <option value="INTERMEDIATE">
                INTERMEDIATE
              </option>

              <option value="ADVANCED">
                ADVANCED
              </option>
            </select>

            <label>Target Level</label>

            <select
              name="targetLevel"
              value={form.targetLevel}
              onChange={handleChange}
            >
              <option value="BEGINNER">
                BEGINNER
              </option>

              <option value="INTERMEDIATE">
                INTERMEDIATE
              </option>

              <option value="ADVANCED">
                ADVANCED
              </option>
            </select>

            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">
                ACTIVE
              </option>

              <option value="PAUSED">
                PAUSED
              </option>

              <option value="COMPLETED">
                COMPLETED
              </option>
            </select>

            <label>Description</label>

            <textarea
              name="description"
              rows="4"
              placeholder="Describe your learning goal..."
              value={form.description}
              onChange={handleChange}
            />

            <button type="submit">
              Add Skill
            </button>
          </form>

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}
        </div>

        {/* SKILL LIST */}

        <div style={styles.skillSection}>
          <h2>My Skills</h2>

          {loading ? (
            <p>Loading skills...</p>
          ) : skills.length === 0 ? (
            <div style={styles.empty}>
              <h3>No skills added yet.</h3>

              <p>
                Add your first skill using the form
                above.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  style={styles.skillCard}
                >
                  <div
                    style={styles.skillHeader}
                  >
                    <div>
                      <h3>
                        {skill.skillName}
                      </h3>

                      <p
                        style={
                          styles.category
                        }
                      >
                        {skill.category}
                      </p>
                    </div>

                    <span
                      style={
                        styles.status
                      }
                    >
                      {skill.status}
                    </span>
                  </div>

                  <p>
                    Current Level:{" "}
                    <strong>
                      {skill.currentLevel}
                    </strong>
                  </p>

                  <p>
                    Target Level:{" "}
                    <strong>
                      {skill.targetLevel}
                    </strong>
                  </p>

                  {skill.description && (
                    <p
                      style={
                        styles.description
                      }
                    >
                      {skill.description}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      handleDelete(
                        skill.id
                      )
                    }
                    style={
                      styles.deleteButton
                    }
                  >
                    Delete Skill
                  </button>
                </div>
              ))}
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
    marginBottom: "25px",
  },

  formCard: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow:
      "0 8px 25px rgba(0, 0, 0, 0.06)",
  },

  skillSection: {
    marginTop: "35px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  skillCard: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow:
      "0 6px 20px rgba(0, 0, 0, 0.05)",
  },

  skillHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  category: {
    color: "#64748b",
    marginTop: "5px",
  },

  status: {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  description: {
    color: "#475569",
    marginTop: "15px",
  },

  deleteButton: {
    background: "#dc2626",
    marginTop: "15px",
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
    textAlign: "center",
  },
};

export default Skills;