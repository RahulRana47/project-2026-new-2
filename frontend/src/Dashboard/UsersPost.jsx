import { useEffect, useState } from "react";
import { getPosts } from "../services/api";
import PostCard from "./myProfiles/PostCard";

const UsersPost = () => {

  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const data = await getPosts();
    setPosts(data.posts);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
  <div className="postsContainer">

    <h2>Community Posts</h2>

    <div className="postsGrid">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          refreshPosts={fetchPosts}
          showMenu={false}
        />
      ))}
    </div>

  </div>
);
};

export default UsersPost;