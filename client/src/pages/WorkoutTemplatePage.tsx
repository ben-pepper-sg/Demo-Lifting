export default function WorkoutTemplatePage() {
  return (
    <div className="bg-white relative w-full h-full min-h-screen p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-inter text-5xl font-normal text-black">
          &lt;Rep Scheme&gt;
        </div>
        <div className="font-inter text-5xl font-normal text-black">
          &lt;Rest Period&gt;
        </div>
      </div>

      {/* Cell Phone Rule */}
      <div className="mb-8">
        <div className="font-inter text-4xl font-normal text-red-600 mb-4">
          10 Burpees per use of cell phone
        </div>
        <hr className="border-black border-t-1" />
      </div>

      {/* Participants and Exercises */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="font-inter text-4xl font-normal text-black">
          &lt;Participants for the hour&gt;
        </div>
        <div className="font-inter text-4xl font-normal text-black">
          <div>&lt;Back Squat /</div>
          <div>Bench Press&gt;</div>
        </div>
        <div className="font-inter text-4xl font-normal text-black">
          <div>&lt;Deadlift /</div>
          <div>Overhead&gt;</div>
        </div>
      </div>

      {/* Weighted Reps Section */}
      <div className="mb-8">
        <hr className="border-black border-t-1 mb-4" />
        <div className="font-inter text-4xl font-normal text-red-600 mb-4">
          30 weighted reps / exercise / set
        </div>
      </div>

      {/* Supplemental Exercises Grid */}
      <div className="grid grid-cols-2 gap-8 border-t border-black pt-8">
        {/* Upper Body Column */}
        <div className="font-inter text-3xl font-normal text-black space-y-4">
          <div>&lt;first upper body supplemental&gt;</div>
          <div>&lt;second upper body supplemental&gt;</div>
          <div>&lt;third upper body supplemental&gt;</div>
          <div>&lt;fourth upper body supplemental&gt;</div>
          <div>&lt;fifth upper body supplemental&gt;</div>
        </div>

        {/* Lower Body Column */}
        <div className="font-inter text-3xl font-normal text-black space-y-4 border-l border-black pl-8">
          <div>&lt;First Lower Body Supplemental&gt;</div>
          <div>&lt;Second Lower Body Supplemental&gt;</div>
          <div>&lt;Third Lower Body Supplemental&gt;</div>
          <div>&lt;Fourth Lower Body Supplemental&gt;</div>
        </div>
      </div>
    </div>
  );
}
