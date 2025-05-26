const mockPosts = [
    {
      id: "1",
      userId: 1,
      title: "Hello World",
      message: "This is my first mock post!",
      categoryId: "sports",
      postLocationLat: -3.745,
      postLocationLong: -38.523,
      rating: 5,
      added: new Date().toISOString(),
      expire: new Date(Date.now() + 86400000).toISOString(), // expires in 1 day
      active: true,
    },
    {
      id: "2",
      userId: 2,
      title: "Another Post",
      message: "Here is another sample post.",
      categoryId: "nightlife",
      postLocationLat: -3.75,
      postLocationLong: -38.52,
      rating: 4,
      added: new Date().toISOString(),
      expire: new Date(Date.now() + 172800000).toISOString(), // expires in 2 days
      active: true,
    },
  ];
  
  // Mimic an asynchronous call that fetches posts.
  // Optionally filter the posts based on the viewed area or other criteria.
  export async function fetchPosts(viewedArea) {
    // You could add filtering logic on mockPosts here based on viewedArea.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPosts);
      }, 500); // Simulates network latency
    });
  }
  
  // Mimic adding a new post.
  // In a real implementation, this would send data to the backend.
  export async function insertPost(postData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPost = {
          id: String(mockPosts.length + 1),
          ...postData,
          added: new Date().toISOString(),
          expire: new Date(Date.now() + 86400000).toISOString(),
          active: true,
        };
        // In a mock scenario, we add it to our local array.
        mockPosts.push(newPost);
        resolve(newPost.id);
      }, 500);
    });
  }