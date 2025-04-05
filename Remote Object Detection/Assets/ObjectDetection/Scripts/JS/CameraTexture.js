let cameraModule = require('LensStudio:CameraModule');
let cameraRequest;
let cameraTexture;
let cameraTextureProvider;


//@input Component.Image uiImage {"hint":"The image in the scene that will be showing the captured frame."}
//@input Asset.Texture screenTexture;

// Public function to get the camera texture
function getCameraTexture() {
   
    // crop before returning
    let screenCropControl = script.screenTexture.control;
    screenCropControl.inputTexture = cameraTexture;//assign the camera module texture output
    //return script.screenTexture;
    return cameraTexture;
    
}

script.createEvent('OnStartEvent').bind(() => {

    cameraRequest = CameraModule.createCameraRequest();

    let camera = global.deviceInfoSystem.getTrackingCameraForId(
        CameraModule.CameraId.Default_Color
      );
      let resolution = camera.resolution;
      print(resolution); // x 682 y 1024 

    cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
    cameraTexture = cameraModule.requestCamera(cameraRequest);
    cameraTextureProvider = cameraTexture.control;
    
    cameraTextureProvider.onNewFrame.add((cameraFrame) => {
        if (script.uiImage) {
            script.uiImage.mainPass.baseTex = cameraTexture;
        }
    });
});

// Make the function accessible through the script
script.getCameraTexture = getCameraTexture;