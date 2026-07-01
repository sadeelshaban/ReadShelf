export type HighlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HighlightStroke = {
  points: Array<{ x: number; y: number }>;
  width: number;
};

export type HighlightPosition = {
  rects?: HighlightRect[];
  strokes?: HighlightStroke[];
  viewportWidth?: number;
  viewportHeight?: number;
};

export type NotePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  viewportWidth?: number;
  viewportHeight?: number;
};

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  category: string | null;
  pdf_path: string;
  cover_path: string | null;
  progress_percent: number;
  last_page: number;
  total_pages: number | null;
  last_opened_at: string | null;
  reading_scroll_y: number | null;
  reading_zoom: number | null;
  created_at: string;
};

export type Highlight = {
  id: string;
  book_id: string;
  user_id: string;
  page_number: number;
  selected_text: string;
  color: string;
  highlight_type: string;
  position: HighlightPosition | null;
  created_at: string;
};

export type Note = {
  id: string;
  book_id: string;
  user_id: string;
  page_number: number;
  note_text: string;
  highlight_id: string | null;
  position: NotePosition | null;
  text_color: string;
  created_at: string;
  updated_at: string;
};

export type BookWithCounts = Book & {
  highlight_count: number;
  note_count: number;
};

export type SortOption = "recent" | "added" | "progress";

export type ReaderTool =
  | "read"
  | "pan"
  | "highlight"
  | "pen"
  | "note"
  | "eraser"
  | "bookmark";

export type Bookmark = {
  id: string;
  book_id: string;
  user_id: string;
  page_number: number;
  scroll_y: number;
  label: string;
  note_text: string;
  color: string;
  created_at: string;
  updated_at: string;
};
