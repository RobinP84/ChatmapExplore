// src/repositories/postService.js
// For now, this file wraps the mockPostRepository,
// but later you can switch it to firebaseRepository mongodbRepository without changing the rest of your app.
import * as Repo from "./mockPostRepository";
//import * as Repo from "../repositories/firebaseRepository";

// Export methods that your app will use.
export const fetchPosts = Repo.fetchPosts;
export const insertPost = Repo.insertPost;

// You can also add additional logic or transformation here if needed.