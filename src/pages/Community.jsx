import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db, storage } from "../firebase";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import Navigation from "../components/Navigation";

function Community() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [commentText, setCommentText] =
    useState({});

  const [comments, setComments] = useState({});

  const [authorProfiles, setAuthorProfiles] =
    useState({});

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [commentSubmitting, setCommentSubmitting] =
    useState({});

  const [message, setMessage] = useState("");

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
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // LOAD POSTS
  // =====================================================

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  async function loadPosts() {
    try {
      setLoading(true);

      const postsRef =
        collection(db, "communityPosts");

      const postsQuery = query(
        postsRef,
        orderBy("createdAt", "desc")
      );

      const snapshot =
        await getDocs(postsQuery);

      const loadedPosts =
        snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,
            ...data,
            likedBy: data.likedBy || [],
          };
        });

      setPosts(loadedPosts);

      // =================================================
      // LOAD AUTHOR PROFILES
      // =================================================

      const profilesData = {};

      for (const post of loadedPosts) {
        if (!post.userId) {
          continue;
        }

        if (profilesData[post.userId]) {
          continue;
        }

        try {
          const profileRef = doc(
            db,
            "users",
            post.userId
          );

          const profileSnapshot =
            await getDoc(profileRef);

          if (profileSnapshot.exists()) {
            profilesData[post.userId] =
              profileSnapshot.data();
          }
        } catch (error) {
          console.error(
            "Author profile loading error:",
            error
          );
        }
      }

      setAuthorProfiles(profilesData);

      // =================================================
      // LOAD COMMENTS
      // =================================================

      const commentsData = {};

      for (const post of loadedPosts) {
        commentsData[post.id] =
          await loadComments(post.id);
      }

      setComments(commentsData);
    } catch (error) {
      console.error(
        "Community posts loading error:",
        error
      );

      setMessage(
        "Unable to load community posts."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD COMMENTS
  // =====================================================

  async function loadComments(postId) {
    try {
      const commentsRef = collection(
        db,
        "communityPosts",
        postId,
        "comments"
      );

      const commentsQuery = query(
        commentsRef,
        orderBy("createdAt", "asc")
      );

      const snapshot =
        await getDocs(commentsQuery);

      return snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        })
      );
    } catch (error) {
      console.error(
        "Comments loading error:",
        error
      );

      return [];
    }
  }

  // =====================================================
  // SELECT POST IMAGE
  // =====================================================

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    // Validate image size
    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setSelectedImage(file);

    // Create local preview
    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setMessage(
      "Image selected successfully."
    );
  }

  // =====================================================
  // UPLOAD POST IMAGE
  // =====================================================

  async function uploadPostImage() {
    if (!user || !selectedImage) {
      return "";
    }

    try {
      const timestamp = Date.now();

      const safeFileName =
        selectedImage.name.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        );

      const imagePath =
        `communityPosts/${user.uid}/${timestamp}_${safeFileName}`;

      const imageRef = ref(
        storage,
        imagePath
      );

      await uploadBytes(
        imageRef,
        selectedImage
      );

      const imageUrl =
        await getDownloadURL(imageRef);

      return imageUrl;
    } catch (error) {
      console.error(
        "Community image upload error:",
        error
      );

      throw new Error(
        "Unable to upload post image."
      );
    }
  }

  // =====================================================
  // CLEAR SELECTED IMAGE
  // =====================================================

  function clearSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
  }

  // =====================================================
  // CREATE POST
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    if (!title.trim()) {
      setMessage(
        "Please enter a post title."
      );
      return;
    }

    if (!content.trim()) {
      setMessage(
        "Please enter something to share."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("Creating your post...");

      // Upload image first if selected
      const imageUrl =
        await uploadPostImage();

      const postsRef =
        collection(db, "communityPosts");

      await addDoc(postsRef, {
        title: title.trim(),
        content: content.trim(),
        userId: user.uid,
        authorEmail:
          user.email || "Community Member",
        likedBy: [],
        imageUrl: imageUrl || "",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setContent("");

      clearSelectedImage();

      setMessage(
        "Post shared successfully."
      );

      await loadPosts();
    } catch (error) {
      console.error(
        "Community post creation error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to create post."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // DELETE OWN POST
  // =====================================================

  async function handleDelete(postId) {
    const confirmed = window.confirm(
      "Delete this post?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "communityPosts", postId)
      );

      setMessage(
        "Post deleted successfully."
      );

      await loadPosts();
    } catch (error) {
      console.error(
        "Community post deletion error:",
        error
      );

      setMessage(
        "Unable to delete post."
      );
    }
  }

  // =====================================================
  // LIKE / UNLIKE POST
  // =====================================================

  async function handleLike(post) {
    if (!user) {
      setMessage("Please login first.");
      return;
    }

    try {
      const postRef = doc(
        db,
        "communityPosts",
        post.id
      );

      const currentLikes =
        post.likedBy || [];

      const alreadyLiked =
        currentLikes.includes(user.uid);

      let updatedLikes;

      if (alreadyLiked) {
        updatedLikes = currentLikes.filter(
          (userId) =>
            userId !== user.uid
        );
      } else {
        updatedLikes = [
          ...currentLikes,
          user.uid,
        ];
      }

      await updateDoc(postRef, {
        likedBy: updatedLikes,
      });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                likedBy: updatedLikes,
              }
            : currentPost
        )
      );
    } catch (error) {
      console.error(
        "Like update error:",
        error
      );

      setMessage(
        "Unable to update like."
      );
    }
  }

  // =====================================================
  // ADD COMMENT
  // =====================================================

  async function handleCommentSubmit(
    event,
    postId
  ) {
    event.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const text =
      commentText[postId]?.trim() || "";

    if (!text) {
      setMessage(
        "Please enter a comment."
      );
      return;
    }

    try {
      setCommentSubmitting(
        (current) => ({
          ...current,
          [postId]: true,
        })
      );

      const commentsRef = collection(
        db,
        "communityPosts",
        postId,
        "comments"
      );

      await addDoc(commentsRef, {
        text,
        userId: user.uid,
        authorEmail:
          user.email || "Community Member",
        createdAt: serverTimestamp(),
      });

      setCommentText((current) => ({
        ...current,
        [postId]: "",
      }));

      const updatedComments =
        await loadComments(postId);

      setComments((current) => ({
        ...current,
        [postId]: updatedComments,
      }));

      setMessage(
        "Comment added successfully."
      );
    } catch (error) {
      console.error(
        "Comment creation error:",
        error
      );

      setMessage(
        "Unable to add comment."
      );
    } finally {
      setCommentSubmitting(
        (current) => ({
          ...current,
          [postId]: false,
        })
      );
    }
  }

  // =====================================================
  // DELETE OWN COMMENT
  // =====================================================

  async function handleDeleteComment(
    postId,
    commentId
  ) {
    const confirmed = window.confirm(
      "Delete this comment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "communityPosts",
          postId,
          "comments",
          commentId
        )
      );

      const updatedComments =
        await loadComments(postId);

      setComments((current) => ({
        ...current,
        [postId]: updatedComments,
      }));

      setMessage(
        "Comment deleted successfully."
      );
    } catch (error) {
      console.error(
        "Comment deletion error:",
        error
      );

      setMessage(
        "Unable to delete comment."
      );
    }
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(timestamp) {
    if (!timestamp) {
      return "Just now";
    }

    try {
      return timestamp
        .toDate()
        .toLocaleString();
    } catch {
      return "Recently";
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* NAVIGATION */}

        <Navigation />

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1>🌍 Community</h1>

            <p style={styles.subtitle}>
              Share your hobby journey, progress
              and learning experiences with others.
            </p>
          </div>
        </div>

        {/* CREATE POST */}

        <div style={styles.createCard}>
          <h2>Share Your Progress</h2>

          <p style={styles.helperText}>
            Tell the community what you are
            learning or practicing.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Post Title</label>

            <input
              type="text"
              placeholder="Example: My Photography Journey"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <label>
              What do you want to share?
            </label>

            <textarea
              placeholder="Share your progress, experience, achievement or learning..."
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              rows="5"
              style={styles.textarea}
            />

            {/* IMAGE UPLOAD */}

            <label>
              Add Image{" "}
              <span style={styles.optionalText}>
                (Optional)
              </span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <p style={styles.imageHelp}>
              JPG, PNG, WEBP or other image files.
              Maximum size: 5 MB.
            </p>

            {/* IMAGE PREVIEW */}

            {imagePreview && (
              <div
                style={styles.previewContainer}
              >
                <img
                  src={imagePreview}
                  alt="Post preview"
                  style={styles.previewImage}
                />

                <button
                  type="button"
                  onClick={clearSelectedImage}
                  style={styles.removeImageButton}
                >
                  Remove Image
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? selectedImage
                  ? "Uploading & Sharing..."
                  : "Sharing..."
                : "Share Post"}
            </button>
          </form>

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}
        </div>

        {/* COMMUNITY FEED */}

        <div style={styles.feedSection}>
          <div style={styles.feedHeader}>
            <div>
              <h2>Community Feed</h2>

              <p style={styles.subtitle}>
                See what other learners are
                sharing.
              </p>
            </div>

            <span style={styles.postCount}>
              {posts.length}{" "}
              {posts.length === 1
                ? "Post"
                : "Posts"}
            </span>
          </div>

          {loading ? (
            <div style={styles.emptyCard}>
              <p>
                Loading community posts...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>
                🌱
              </div>

              <h3>
                No community posts yet
              </h3>

              <p>
                Be the first person to share
                your hobby journey!
              </p>
            </div>
          ) : (
            <div style={styles.postList}>
              {posts.map((post) => {
                const postComments =
                  comments[post.id] || [];

                const likedBy =
                  post.likedBy || [];

                const isLiked =
                  user &&
                  likedBy.includes(user.uid);

                const authorProfile =
                  authorProfiles[
                    post.userId
                  ];

                return (
                  <div
                    key={post.id}
                    style={styles.postCard}
                  >
                    {/* POST HEADER */}

                    <div
                      style={
                        styles.postHeader
                      }
                    >
                      <div
                        style={
                          styles.authorSection
                        }
                      >
                        {authorProfile?.profileImage ? (
                          <img
                            src={
                              authorProfile.profileImage
                            }
                            alt="Profile"
                            style={
                              styles.authorImage
                            }
                          />
                        ) : (
                          <div
                            style={
                              styles.authorPlaceholder
                            }
                          >
                            👤
                          </div>
                        )}

                        <div>
                          <h3>
                            {post.title}
                          </h3>

                          <p
                            style={
                              styles.author
                            }
                          >
                            {authorProfile?.username
                              ? `@${authorProfile.username}`
                              : post.authorEmail ||
                                "Community Member"}
                          </p>

                          {authorProfile?.name && (
                            <p
                              style={
                                styles.authorName
                              }
                            >
                              {authorProfile.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {post.userId ===
                        user?.uid && (
                        <button
                          onClick={() =>
                            handleDelete(
                              post.id
                            )
                          }
                          style={
                            styles.deleteButton
                          }
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* POST CONTENT */}

                    <p
                      style={
                        styles.postContent
                      }
                    >
                      {post.content}
                    </p>

                    {/* POST IMAGE */}

                    {post.imageUrl && (
                      <div
                        style={
                          styles.postImageContainer
                        }
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          style={
                            styles.postImage
                          }
                        />
                      </div>
                    )}

                    {/* POST FOOTER */}

                    <div
                      style={
                        styles.postFooter
                      }
                    >
                      <span>
                        📅{" "}
                        {formatDate(
                          post.createdAt
                        )}
                      </span>

                      <span>
                        ☁️ Cloud Shared
                      </span>
                    </div>

                    {/* LIKE SECTION */}

                    <div
                      style={
                        styles.interactionBar
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleLike(post)
                        }
                        style={{
                          ...styles.likeButton,
                          ...(isLiked
                            ? styles.likedButton
                            : {}),
                        }}
                      >
                        {isLiked
                          ? "❤️ Liked"
                          : "🤍 Like"}{" "}
                        {likedBy.length}
                      </button>

                      <span
                        style={
                          styles.commentCount
                        }
                      >
                        💬{" "}
                        {postComments.length}{" "}
                        {postComments.length ===
                        1
                          ? "Comment"
                          : "Comments"}
                      </span>
                    </div>

                    {/* COMMENTS */}

                    <div
                      style={
                        styles.commentsSection
                      }
                    >
                      <h4>
                        💬 Comments
                      </h4>

                      {postComments.length ===
                      0 ? (
                        <p
                          style={
                            styles.noComments
                          }
                        >
                          No comments yet. Be the
                          first to comment!
                        </p>
                      ) : (
                        <div
                          style={
                            styles.commentList
                          }
                        >
                          {postComments.map(
                            (comment) => (
                              <div
                                key={
                                  comment.id
                                }
                                style={
                                  styles.commentCard
                                }
                              >
                                <div
                                  style={
                                    styles.commentHeader
                                  }
                                >
                                  <strong>
                                    👤{" "}
                                    {comment.authorEmail ||
                                      "Community Member"}
                                  </strong>

                                  {comment.userId ===
                                    user?.uid && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(
                                          post.id,
                                          comment.id
                                        )
                                      }
                                      style={
                                        styles.commentDeleteButton
                                      }
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>

                                <p
                                  style={
                                    styles.commentText
                                  }
                                >
                                  {comment.text}
                                </p>

                                <span
                                  style={
                                    styles.commentDate
                                  }
                                >
                                  {formatDate(
                                    comment.createdAt
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* ADD COMMENT */}

                      <form
                        onSubmit={(event) =>
                          handleCommentSubmit(
                            event,
                            post.id
                          )
                        }
                        style={
                          styles.commentForm
                        }
                      >
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={
                            commentText[
                              post.id
                            ] || ""
                          }
                          onChange={(event) =>
                            setCommentText(
                              (current) => ({
                                ...current,
                                [post.id]:
                                  event.target
                                    .value,
                              })
                            )
                          }
                        />

                        <button
                          type="submit"
                          disabled={
                            commentSubmitting[
                              post.id
                            ]
                          }
                          style={
                            styles.commentButton
                          }
                        >
                          {commentSubmitting[
                            post.id
                          ]
                            ? "Adding..."
                            : "Comment"}
                        </button>
                      </form>
                    </div>
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
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  subtitle: {
    color: "#64748b",
    lineHeight: "1.6",
  },

  createCard: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.06)",
  },

  helperText: {
    color: "#64748b",
    marginBottom: "20px",
  },

  optionalText: {
    color: "#94a3b8",
    fontWeight: "400",
  },

  imageHelp: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "6px",
  },

  textarea: {
    width: "100%",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  previewContainer: {
    marginTop: "15px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  previewImage: {
    display: "block",
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    borderRadius: "10px",
    background: "#e2e8f0",
  },

  removeImageButton: {
    width: "auto",
    marginTop: "10px",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  message: {
    marginTop: "18px",
    padding: "12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "8px",
  },

  feedSection: {
    marginTop: "35px",
  },

  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  postCount: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  postList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  postCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow:
      "0 6px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },

  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  authorSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  authorImage: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #dbeafe",
    flexShrink: 0,
  },

  authorPlaceholder: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },

  author: {
    color: "#2563eb",
    fontSize: "13px",
    marginTop: "6px",
  },

  authorName: {
    color: "#64748b",
    fontSize: "12px",
    marginTop: "3px",
  },

  postContent: {
    marginTop: "18px",
    lineHeight: "1.7",
    color: "#334155",
    whiteSpace: "pre-wrap",
  },

  postImageContainer: {
    marginTop: "18px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#f1f5f9",
  },

  postImage: {
    display: "block",
    width: "100%",
    maxHeight: "500px",
    objectFit: "contain",
    margin: "0 auto",
  },

  postFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
  },

  interactionBar: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #e2e8f0",
  },

  likeButton: {
    width: "auto",
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  likedButton: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },

  commentCount: {
    color: "#64748b",
    fontSize: "14px",
  },

  commentsSection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
  },

  noComments: {
    color: "#94a3b8",
    fontSize: "14px",
  },

  commentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
  },

  commentCard: {
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  commentText: {
    margin: "8px 0",
    color: "#334155",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  commentDate: {
    color: "#94a3b8",
    fontSize: "11px",
  },

  commentDeleteButton: {
    width: "auto",
    background: "transparent",
    color: "#dc2626",
    border: "none",
    padding: "3px 5px",
    fontSize: "11px",
    cursor: "pointer",
  },

  commentForm: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  commentButton: {
    width: "auto",
    whiteSpace: "nowrap",
    padding: "10px 15px",
  },

  deleteButton: {
    width: "auto",
    background: "#dc2626",
    padding: "8px 12px",
    fontSize: "12px",
  },

  emptyCard: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "14px",
    textAlign: "center",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },
};

export default Community;