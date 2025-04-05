// import required modules
const WorldQueryModule = require("LensStudio:WorldQueryModule");
const SIK = require("SpectaclesInteractionKit/SIK").SIK;
const InteractorTriggerType =
  require("SpectaclesInteractionKit/Core/Interactor/Interactor").InteractorTriggerType;

// Import CameraService
import {
  CameraService,
  CameraType,
} from "../ObjectDetection/Scripts/TS/CameraService";
const EPSILON = 0.01;

@component
export class NewScript extends BaseScriptComponent {
  private hitTestSession: HitTestSession;
  private transform: Transform;
  private cameraService: CameraService;
  @input
  indexToSpawn: number;

  @input
  targetObject: SceneObject;

  @input
  objectsToSpawn: SceneObject[];

  @input
  filterEnabled: boolean;

  onAwake() {
    // Initialize CameraService
    this.cameraService = CameraService.getInstance();
    print("CameraService initialized in WorldQueryHitAdjuster");
    // create new hit session
    this.hitTestSession = this.createHitTestSession(this.filterEnabled);
    if (!this.sceneObject) {
      print("Please set Target Object input");
      return;
    }
    this.transform = this.targetObject.getTransform();
    // disable target object when surface is not detected
    this.targetObject.enabled = false;
    this.setObjectEnabled(this.indexToSpawn);
    // create update event
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
  }

  createHitTestSession(filterEnabled) {
    // create hit test session with options
    var options = HitTestSessionOptions.create();
    options.filter = filterEnabled;

    var session = WorldQueryModule.createHitTestSessionWithOptions(options);
    return session;
  }

  onHitTestResult(results) {
    if (results === null) {
      this.targetObject.enabled = false;
    } else {
      this.targetObject.enabled = true;
      // get hit information
      const hitPosition = results.position;
      const hitNormal = results.normal;

      //identifying the direction the object should look at based on the normal of the hit location.

      var lookDirection;
      if (1 - Math.abs(hitNormal.normalize().dot(vec3.up())) < EPSILON) {
        lookDirection = vec3.forward();
      } else {
        lookDirection = hitNormal.cross(vec3.up());
      }

      const toRotation = quat.lookAt(lookDirection, hitNormal);
      //set position and rotation
      this.targetObject.getTransform().setWorldPosition(hitPosition);
      this.targetObject.getTransform().setWorldRotation(toRotation);
    }
  }

  onUpdate() {
    const rayStart = this.getCameraPosition();
    const direction = this.cameraService
      .getCamera(CameraType.Main)
      .getTransform().back;

    // Create rayEnd by manually adding scaled direction components
    const rayEnd = new vec3(
      rayStart.x + direction.x * 1000,
      rayStart.y + direction.y * 1000,
      rayStart.z + direction.z * 1000
    );

    this.hitTestSession.hitTest(
      rayStart,
      rayEnd,
      this.onHitTestResult.bind(this)
    );
  }

  setObjectIndex(i) {
    this.indexToSpawn = i;
  }

  setObjectEnabled(i) {
    for (let i = 0; i < this.objectsToSpawn.length; i++)
      this.objectsToSpawn[i].enabled = i == this.indexToSpawn;
  }

  getCameraPosition(): vec3 {
    const mainCamera = this.cameraService.getCamera(CameraType.Main);
    return mainCamera.getTransform().getWorldPosition();
  }
}
