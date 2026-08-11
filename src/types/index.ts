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

export type HighlightShape = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  filled: boolean;
  strokeWidth: number;
};

export type HighlightPosition = {
  rects?: HighlightRect[];
  strokes?: HighlightStroke[];
  shape?: HighlightShape;
  viewportWidth?: number;
  viewportHeight?: number;
};

export type NotePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  title?: string;
  rotation?: number;
  /** sticky = paper note; comment = light text annotation */
  kind?: "sticky" | "comment";
  /** When true, fontSize is screen pixels and does not scale with page zoom. */
  commentFontScreen?: boolean;
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
  read_count: number;
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
  | "comment"
  | "eraser"
  | "bookmark"
  | "shape";

export type ShapeKind = "rect" | "ellipse" | "line" | "arrow" | "double_arrow";

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

export type ReadingList = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ReadingListWithCount = ReadingList & {
  book_count: number;
};

/** Lightweight book snippet shown on list cards (Wattpad-style previews). */
export type ReadingListPreviewBook = {
  id: string;
  title: string;
  author: string;
  cover_path: string | null;
};

export type ReadingListWithPreview = ReadingListWithCount & {
  preview_books: ReadingListPreviewBook[];
};

export type ListSortOption = "recent" | "created" | "name" | "books";
