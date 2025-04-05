
/*
import {
  withAlpha,
  withoutAlpha,
} from "../../../SpectaclesInteractionKit/Utils/color";
import InteractorLineRenderer, {
  VisualStyle,
} from "../../../SpectaclesInteractionKit/Components/Interaction/InteractorLineVisual/InteractorLineRenderer";

@component
export class ClosedPolyline extends BaseScriptComponent {
  @input
  public points!: SceneObject[];

  @input
  private lineMaterial!: Material;

  @input("vec3", "{1, 1, 0}")
  @widget(new ColorWidget())
  public _color: vec3 = new vec3(1, 1, 0);

  @input
  private lineWidth: number = 0.5;

  @input
  @widget(
    new ComboBoxWidget()
      .addItem("Full", 0)
      .addItem("Split", 1)
      .addItem("FadedEnd", 2)
  )
  public lineStyle: number = 0;

  private _enabled = true;
  private line!: InteractorLineRenderer;
  private transform!: Transform;

  set isEnabled(isEnabled: boolean) {
    this._enabled = isEnabled;
    if (this.line) {
      this.line.getSceneObject().enabled = isEnabled;
    }
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  onAwake() {
    if (!this.points || this.points.length < 2) {
      throw new Error("ClosedPolylineVisual requires at least 2 points");
    }

    this.transform = this.sceneObject.getTransform();
    this.createOrUpdateLine();
  }

  // New method to refresh the line when points move
  refreshLine(): void {
    if (!this.line || !this.points || this.points.length < 2) {
      print("Cannot refresh line: Invalid state");
      return;
    }

    // Recalculate positions and update the line
    this.createOrUpdateLine();
  }

  // Helper method to create or update the line
  private createOrUpdateLine(): void {
    const positions = this.points.map((point) =>
      point.getTransform().getLocalPosition()
    );
    positions.push(positions[0]); // Close the shape

    if (!this.line) {
      // Initial creation
      this.line = new InteractorLineRenderer({
        material: this.lineMaterial,
        points: positions,
        startColor: withAlpha(this._color, 1),
        endColor: withAlpha(this._color, 1),
        startWidth: this.lineWidth,
        endWidth: this.lineWidth,
      });
      this.line.getSceneObject().setParent(this.sceneObject);
      if (this.lineStyle !== undefined) {
        this.line.visualStyle = this.lineStyle;
      }
    } else {
      // Update existing line
      this.line.points = positions; // Assuming InteractorLineRenderer supports updating points
    }

    this.line.getSceneObject().enabled = this._enabled;
  }

  onDestroy(): void {
    if (this.line) {
      this.line.destroy();
    }
    this.sceneObject.destroy();
  }

  // Method to get polyline points, exposed for JavaScript access
  getPoints(): SceneObject[] {
    return this.points || [];
  }

  // Method to set the color of the polyline, exposed for JavaScript access
  setColor(color: vec3): void {
    this._color = color;
    if (this.line) {
      const colorWithAlpha = withAlpha(color, 1);
      this.line.startColor = colorWithAlpha;
      this.line.endColor = colorWithAlpha;
    } else {
      print("Warning: ClosedPolyline line not initialized");
    }
  }

  // Optional: Method to set new points and refresh the line
  setPoints(newPoints: SceneObject[]): void {
    if (newPoints.length < 2) {
      print("Error: At least 2 points are required");
      return;
    }
    this.points = newPoints;
    this.refreshLine();
  }
}
  */

import { withAlpha } from "../../../SpectaclesInteractionKit/Utils/color"
import InteractorLineRenderer from "../../../SpectaclesInteractionKit/Components/Interaction/InteractorLineVisual/InteractorLineRenderer"

/**
 * This class provides visual representation for a polyline that can be rendered as a continuous or split sequence of lines.
 */
@component
export class ClosedPolyline extends BaseScriptComponent {
  @input
  public points!: SceneObject[]

  @input
  private lineMaterial!: Material

  @input("vec3", "{1, 1, 0}")
  @widget(new ColorWidget())
  public _color: vec3 = new vec3(1, 1, 0)

  @input
  private lineWidth: number = 0.5

  @input
  @widget(
    new ComboBoxWidget()
      .addItem("Full", 0)
      .addItem("Split", 1)
      .addItem("FadedEnd", 2),
  )
  public lineStyle: number = 0

  @input

  public continuousLine: boolean = true

  private _enabled = true
  private lines: InteractorLineRenderer[] = []
  private transform!: Transform

  set isEnabled(isEnabled: boolean) {
    this._enabled = isEnabled
    this.lines.forEach(line => {
      line.getSceneObject().enabled = isEnabled
    })
  }

  get isEnabled(): boolean {
    return this._enabled
  }

  onAwake() {
    if (!this.points || this.points.length < 2) {
      throw new Error("ClosedPolylineVisual requires at least 2 points")
    }

    this.transform = this.sceneObject.getTransform()
    this.createOrUpdateLines()
  }

  refreshLine(): void {
    if (!this.points || this.points.length < 2) {
      print("Cannot refresh line: Invalid state")
      return
    }

    // Recalculate positions and update the lines
    this.createOrUpdateLines()
  }

  private createOrUpdateLines(): void {
    // Clear existing lines
    this.lines.forEach(line => line.destroy())
    this.lines = []

    const positions = this.points.map(point =>
      point.getTransform().getLocalPosition()
    )
    if (this.continuousLine) {
      // Render as a single closed line
      positions.push(positions[0])
      const line = new InteractorLineRenderer({
        material: this.lineMaterial,
        points: positions,
        startColor: withAlpha(this._color, 1),
        endColor: withAlpha(this._color, 1),
        startWidth: this.lineWidth,
        endWidth: this.lineWidth,
      })
      line.getSceneObject().setParent(this.sceneObject)
      line.visualStyle = this.lineStyle
      this.lines.push(line)
    } else {
      // Render as separate lines between each pair of points
      for (let i = 0; i < positions.length; i++) {
        const startIndex = i
        const endIndex = (i + 1) % positions.length
        const line = new InteractorLineRenderer({
          material: this.lineMaterial,
          points: [positions[startIndex], positions[endIndex]],
          startColor: withAlpha(this._color, 1),
          endColor: withAlpha(this._color, 1),
          startWidth: this.lineWidth,
          endWidth: this.lineWidth,
        })
        line.getSceneObject().setParent(this.sceneObject)
        line.visualStyle = this.lineStyle
        this.lines.push(line)
      }
    }

    this.isEnabled = this._enabled
  }

  onDestroy(): void {
    this.lines.forEach(line => line.destroy())
    this.sceneObject.destroy()
  }

  getPoints(): SceneObject[] {
    return this.points || []
  }

  setColor(color: vec3): void {
    this._color = color
    this.lines.forEach(line => {
      const colorWithAlpha = withAlpha(color, 1)
      line.startColor = colorWithAlpha
      line.endColor = colorWithAlpha
    })
  }

  setPoints(newPoints: SceneObject[]): void {
    if (newPoints.length < 2) {
      print("Error: At least 2 points are required")
      return
    }
    this.points = newPoints
    this.refreshLine()
  }
}
