import React from "react";
import ChapterMeetingForm from "./ChapterMeetingForm";

const CreateChapterMeeting = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Chapter Meeting</h1>
      <ChapterMeetingForm mode="create" />
    </div>
  );
};

export default CreateChapterMeeting;