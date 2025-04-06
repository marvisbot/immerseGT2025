//@ui {"widget":"group_start", "label":"Input Configuration"}
//@input SceneObject buttonSingleDetection {"hint":"Drag the SceneObject that has the Interactable component"}
//@ui {"widget":"group_end"}





var remoteServiceModule = require("LensStudio:RemoteServiceModule");

script.createEvent("OnStartEvent").bind(() => {
    onStart();
  });

function onStart() {
    print("Starting Spanish TTS Manager");

    const SIK = require("SpectaclesInteractionKit/SIK").SIK;
    const interactionManager = SIK.InteractionManager;
    const interactionConfiguration = SIK.InteractionConfiguration;

    if (!script.buttonSingleDetection) {
        print(
          "Warning: Please assign a SceneObject with an Interactable component in the inspector"
        );
        return;
    }
    // Get the Interactable from the referenced SceneObject
    const interactableSingleDetection =
    interactionManager.getInteractableBySceneObject(
    script.buttonSingleDetection
    );

    if (!interactableSingleDetection) {
        print(
        "Warning: Could not find Interactable component on the referenced SceneObject"
        );
        return;
    }
    // Define the callback for trigger end event
    const onTriggerEndCallbackSingleDetection = (event) => {
        handleTriggerEndSingleDetection(event);
        print(
        `Interaction SingleDetection triggered by: ${event.interactor.inputType} at position: ${event.interactor.targetHitInfo.hit.position}`
        );
    };
    // Bind the callback to the trigger end event
    interactableSingleDetection.onInteractorTriggerEnd(
        onTriggerEndCallbackSingleDetection
    );
}

// Ensure single detection stops continuous mode
async function handleTriggerEndSingleDetection(event) {
    print("handleTriggerEndSingleDetection");
}

