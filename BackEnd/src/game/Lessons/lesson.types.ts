export interface MicomiNavigationResponse {
  level: {
    level_id: number;
    level_title: string | null;
    total_pages: number;
  };
  currentLesson: {
    lesson_id: number;
    page_number: number;
    page_url: string;
  };
  previousLesson: {
    lesson_id: number;
    page_number: number;
    page_url: string;
  } | null;
  lesson: {
    next_lesson_id: number | null;
    previous_lesson_id: number | null;
    is_first_page: boolean;
    is_last_page: boolean;
    show_complete_button: boolean;
  };
  progress: {
    is_micomi_completed: boolean;
  };
}

export interface MicomiNavigationErrorResponse {
  message: string;
  success: false;
}
