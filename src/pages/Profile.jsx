import { useEffect, useState } from "react";

import { auth, storage } from "../firebase";

import {
  createOrUpdateProfile,
  getUserProfile,
} from "../services/firestoreService";

import Navigation from "../components/Navigation";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

function Profile() {
  const user = auth.currentUser;

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    interests: "",
  });

  const [profileImage, setProfileImage] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profile =
          await getUserProfile(user.uid);

        if (profile) {
          setForm({
            name: profile.name || "",
            username: profile.username || "",
            bio: profile.bio || "",
            interests:
              profile.interests || "",
          });

          setProfileImage(
            profile.profileImage || ""
          );
        }
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );

        setMessage(
          "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Image size must be less than 5 MB."
      );
      return;
    }

    setSelectedImage(file);

    setMessage(
      "Image selected. Click Save Profile to upload it."
    );
  }

  async function uploadProfileImage() {
    if (!user || !selectedImage) {
      return profileImage;
    }

    try {
      setUploading(true);

      const imageRef = ref(
        storage,
        `profileImages/${user.uid}/${selectedImage.name}`
      );

      await uploadBytes(
        imageRef,
        selectedImage
      );

      const imageUrl =
        await getDownloadURL(imageRef);

      setProfileImage(imageUrl);

      return imageUrl;
    } catch (error) {
      console.error(
        "Profile image upload error:",
        error
      );

      throw new Error(
        "Unable to upload profile image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    try {
      setMessage("Saving profile...");

      const imageUrl =
        await uploadProfileImage();

      await createOrUpdateProfile(
        user.uid,
        {
          ...form,
          profileImage: imageUrl || "",
        }
      );

      setSelectedImage(null);

      setMessage(
        "Profile saved successfully."
      );
    } catch (error) {
      console.error(
        "Profile save error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to save profile."
      );
    }
  }

  if (loading) {
    return (
      <p style={{ padding: "30px" }}>
        Loading profile...
      </p>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* REUSABLE NAVIGATION */}
        <Navigation />

        {/* PROFILE CONTENT */}

        <h1>My Profile</h1>

        <p style={styles.email}>
          Account: {user?.email}
        </p>

        {/* PROFILE IMAGE */}

        <div style={styles.imageSection}>
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              style={styles.profileImage}
            />
          ) : (
            <div style={styles.placeholder}>
              👤
            </div>
          )}

          <label>
            Profile Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          {selectedImage && (
            <p style={styles.selectedImage}>
              Selected: {selectedImage.name}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label>Name</label>

          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
          />

          <label>Username</label>

          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={form.username}
            onChange={handleChange}
          />

          <label>Bio</label>

          <textarea
            name="bio"
            placeholder="Tell the community about yourself"
            value={form.bio}
            onChange={handleChange}
            rows="4"
          />

          <label>Interests</label>

          <input
            type="text"
            name="interests"
            placeholder="Coding, Photography, Music"
            value={form.interests}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={uploading}
          >
            {uploading
              ? "Uploading Image..."
              : "Save Profile"}
          </button>
        </form>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}
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
    maxWidth: "650px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow:
      "0 10px 30px rgba(0, 0, 0, 0.06)",
  },

  email: {
    color: "#64748b",
    marginBottom: "25px",
  },

  imageSection: {
    marginBottom: "25px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
  },

  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    margin: "0 auto 20px",
    border: "4px solid #dbeafe",
  },

  placeholder: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "50px",
    margin: "0 auto 20px",
  },

  selectedImage: {
    marginTop: "10px",
    color: "#475569",
    fontSize: "14px",
  },

  message: {
    marginTop: "20px",
    padding: "12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
  },
};

export default Profile;