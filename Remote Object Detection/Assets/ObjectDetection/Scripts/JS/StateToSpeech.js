// @input Component.Text inputText
// @input Component.Script ttsComponent {"hint":"Attach the TextToSpeechOpenAI Component"}

script.createEvent("OnStartEvent").bind(() => {
    onStart();
});

function onStart() {
    const SIK = require("SpectaclesInteractionKit/SIK").SIK;
    const interactionManager = SIK.InteractionManager;
    const interactionConfiguration = SIK.InteractionConfiguration;

    const interactableSingleDetection =
    interactionManager.getInteractableBySceneObject(
      script.getSceneObject()
    );

  if (!interactableSingleDetection) {
    debugLog(
      "Warning: Could not find Interactable component on the referenced SceneObject"
    );
    return;
  }

  // Define the callback for trigger end event
  const onTriggerEndCallbackSingleDetection = (event) => {
    handleTriggerEndSingleDetection(event);
    debugLog(`Interaction SingleDetection triggered by: ${event.interactor.inputType} at position: ${event.interactor.targetHitInfo.hit.position}`);
  };

  // Bind the callback to the trigger end event
  interactableSingleDetection.onInteractorTriggerEnd(
    onTriggerEndCallbackSingleDetection
  );
}

function debugLog(message) {
    // Standard console print
    print(message);
  
    // Update script logs
    if (script.logs) {
      script.logs.text = message;
    }
  
    // Debug log using TypeScript component's functionality
    if (script.logConfig && script.logConfig.debugModeEnabled) {
      print(message); // When debug mode is enabled, print the message
    }
} 

async function handleTriggerEndSingleDetection(event) {
    var inputValue = script.inputText.text;
    script.api.generateAndPlaySpeech(inputValue);
    debugLog("Button pressed! Text output: " + inputValue);  
}
  


// var sceneObject = script.getSceneObject();
// var interactionComponent = sceneObject.getComponent('Interactable');


// function onTouchStart(eventArgs) {
//     print(
//       '[Tapped on] ' +
//         sceneObject.name +
//         ', [Touch position] ' +
//         eventArgs.position +
//         ', [Touch Index] ' +
//         eventArgs.touchId
//     );
//   }
  
//   interactionComponent.onTouchStart.add(onTouchStart);

// // script.createEvent('TouchStartEvent').bind(function (eventData) {
// //     var inputValue = script.inputText.text;    
// //     // Print to console
// //     print("Button pressed! Text output: " + inputValue);
// // });