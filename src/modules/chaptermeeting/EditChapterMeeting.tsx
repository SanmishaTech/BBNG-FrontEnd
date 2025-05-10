import React from "react";
import ChapterMeetingForm from "./ChapterMeetingForm";

const EditChapterMeeting = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Chapter Meeting</h1>
      <ChapterMeetingForm mode="edit" />
    </div>
  );
};

export default EditChapterMeeting;