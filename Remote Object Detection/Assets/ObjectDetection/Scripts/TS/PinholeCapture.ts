import WorldCameraFinderProvider from "SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider";
import { PinholeCameraModel } from "./PinholeCameraModel";

@component
export class PinholeCapture extends BaseScriptComponent {
  private cameraModule: CameraModule = require("LensStudio:CameraModule");
  private cameraRequest: CameraModule.CameraRequest;
  cameraModel: any;
  cameraDevice: any;
  mainCamera: any;
  viewToWorld: any;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      // Initialize camera module and its dependencies
      this.cameraRequest = CameraModule.createCameraRequest();
      this.cameraRequest.cameraId = CameraModule.CameraId.Right_Color;
      const cameraTexture = this.cameraModule.requestCamera(this.cameraRequest);
      this.cameraDevice = global.deviceInfoSystem.getTrackingCameraForId(
        this.cameraRequest.cameraId
      );
      this.cameraModel = PinholeCameraModel.create(this.cameraDevice);
      // crop to match the aspect ratio of the camera
      // 0.15 is the offset frm the resized vertex 
      /*
      this.cameraModel.crop(
        this.cameraModel.resolution.uniformScale(0.15),
        this.cameraModel.resolution.uniformScale(0.7)
      )
        this.cameraModel.resize(new vec2(640, 480))
        */
      

      this.mainCamera = WorldCameraFinderProvider.getInstance().getComponent();
    });
  }
/*
 saveMatrix()  {
    this.viewToWorld = this.mainCamera
      .getTransform()
      .getWorldTransform();
      print("Called saveMatrix")
  }
      */

  saveMatrix() {
    if (!this.mainCamera) {
      print("Error: mainCamera is not initialized");
      return false;
    }
    
    try {
      this.viewToWorld = this.mainCamera.getTransform().getWorldTransform();
      print("Matrix saved successfully");
      return true;
    } catch (e) {
      print("Error saving matrix: " + e);
      return false;
    }
  }

  worldToCapture(worldPos: vec3): vec2 {
    const viewPos = this.viewToWorld.inverse().multiplyPoint(worldPos);
    const capturePos = this.cameraDevice.pose.multiplyPoint(viewPos);
    const captureUV = this.cameraModel.projectToUV(capturePos);
    return captureUV;
  }
/*
  captureToWorld(captureUV: vec2, depth: number): vec3 {
    const capturePos = this.cameraModel.unprojectFromUV(captureUV, depth);
    const viewPos = this.cameraDevice.pose.inverse().multiplyPoint(capturePos);
    const worldPos = this.viewToWorld.multiplyPoint(viewPos);
    r
    */
    captureToWorld(captureUV: vec2, depth: number): vec3 {
      if (!this.viewToWorld) {
        print("Error: viewToWorld matrix is undefined. Call saveMatrix() first.");
        // Return a default position or null
        return new vec3(0, 0, 0);
      }
      
      const capturePos = this.cameraModel.unprojectFromUV(captureUV, depth);
      const viewPos = this.cameraDevice.pose.inverse().multiplyPoint(capturePos);
      const worldPos = this.viewToWorld.multiplyPoint(viewPos);
      return worldPos;
    }
}
