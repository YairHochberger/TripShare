const mongoose = require("mongoose");

// A photo somebody on the trip added afterwards. The file itself lives on
// disk under /uploads; only the filename is stored here.
const tripPhotoSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    filename: { type: String, required: true },
    caption: { type: String, default: "", maxlength: 200 },
  },
  { timestamps: true }
);

tripPhotoSchema.index({ trip: 1, createdAt: -1 });

module.exports = mongoose.model("TripPhoto", tripPhotoSchema);
