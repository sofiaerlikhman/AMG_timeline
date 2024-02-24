const modelParams = {
  flipHorizontal: true,
  imageScaleFactor: 0.7,
  maxNumBoxes: 1,
  iouThreshold: 0.5,
  scoreThreshold: 0.9,
};

const genres = {
  gegenwart: {
    source: "../sounds/gegenwart.mp3",
  },
  zukunft: {
    source: "../sounds/zukunft.mp3",
  },
  gegenwartzukunft: {
    source: "../sounds/gegenwart+zukunft.mp3",
  },
  vergangenheitgegenwart: {
    source: "../sounds/gegenwart+vergangenheit.mp3",
  },
  vergangenheit: {
    source: "../sounds/vergangenheit.mp3",
  },
};

const video = document.getElementsByTagName("video")[0];
const audio = document.getElementsByTagName("audio")[0];
const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");
let model;
var volume = 1;
let previousTrack = "";
let currentTrack = "";
transitionInProgress = false;
let prevX = null;

function loadModel() {
  handTrack.load().then((_model) => {
    model = _model;
    model.setModelParameters(modelParams);
    runDetection();
    document.getElementById("loading").remove();
  });
}

handTrack.startVideo(video).then(function (status) {
  if (status) {
    loadModel();
  } else {
    console.log("Please enable video");
  }
});

function runDetection() {
  model.detect(video).then((predictions) => {
    model.renderPredictions(predictions, canvas, context, video);
    requestAnimationFrame(runDetection);

    if (predictions.length > 0) {
      let x = predictions[0].bbox[0];
      let y = predictions[0].bbox[1];
      var newTrack = "";

      if (prevX !== null) {
        const deltaX = x - prevX;
        const scrollSpeed = 20; // Adjust scroll speed as needed

        // Scroll the image based on the change in hand position
       // document.getElementById("longImage").scrollLeft -= deltaX * scrollSpeed;
        document.body.style.backgroundPositionX = (parseFloat(getComputedStyle(document.body).backgroundPositionX) - deltaX * scrollSpeed) + 'px';
      }
      prevX = x;
//Apply proper music source and filter based on hand position
if (y <= 600) {
  if (x <= 150) {
    // vergangenheit
    newTrack = genres.vergangenheit.source;
  } else if (x > 150 && x < 250) {
    // vergangenheit + gegenwart
    newTrack = genres.vergangenheitgegenwart.source;
  } else if (x >= 250 && x <= 350) {
    // gegenwart
    newTrack = genres.gegenwart.source;
  } else if (x > 350 && x < 450) {
    // gegenwart + zukunft
    newTrack = genres.gegenwartzukunft.source;
  } else if (x >= 450) {
    // zukunft
    newTrack = genres.zukunft.source;
  }

  if (currentTrack === ""){
    currentTrack = newTrack;
    audio.src = newTrack;
    audio.play();
    console.log("track seted: " + currentTrack)
  } else if (currentTrack != newTrack) {
    // Check if a transition is ongoing (add flag and initialization)
    if (!transitionInProgress) {
      transitionInProgress = true;
      let transitionInterval = 2000; // 2 seconds for transition

      let transition = setInterval(() => {
        if (audio.volume - 0.05 > 0) {
          audio.volume -= 0.05;
        } else {
          audio.volume = 0;
        }
        if (audio.volume <= 0) {
          clearInterval(transition);
          audio.pause();

          previousTrack = currentTrack;
          currentTrack = newTrack;
          audio.src = currentTrack;
          audio.volume = 0; // Start new track at 0 volume
          audio.play()
            .then(() => { // Handle successful playback
              let fadeInInterval = setInterval(() => {
                if (audio.volume + 0.05 < 1) {
                  audio.volume += 0.05; // Increase volume by 0.05 each step
                } else {
                  audio.volume = 1;
                }

                if (audio.volume == 1) {
                  clearInterval(fadeInInterval);
                  // Fade-in complete
                }
              }, transitionInterval / 40); // 40 steps for smoother transition
              transitionInProgress = false; // Mark transition complete
            })
            .catch(error => { // Handle playback error
              console.error("Error playing new track:", error);
              transitionInProgress = false;
              currentTrack = previousTrack;
            });

          console.log("track updated: " + currentTrack);
        }
      }, transitionInterval / 20);
    } else {
      console.log("Transition already in progress, delaying new transition");
    }
  }
}
} 
});
}