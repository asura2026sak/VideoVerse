export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  duration: string;
  durationSeconds: number;
  views: number;
  uploadDate: string;
  videoUrl: string;
  thumbnailUrl: string;
  author: string;
  likes: number;
  comments: Comment[];
}
