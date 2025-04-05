//@input Asset.Texture texture
//@input Component.Image outputImage

function printEncodedString(result) {
    print("Encoded texture: " + result)
    //decode the string back and display
    decode(result).then(displayTexture).catch(printError)
}

function printError(error) {
    print("Error: " + error)

}

function displayTexture(texture) {
    print("Texture: " + texture)
    if (script.outputImage) {
        script.outputImage.mainMaterial.mainPass.baseTex = texture
    }
}

function encode(texture) {
    return new Promise(function (resolve, reject) {
        Base64.encodeTextureAsync(texture, resolve, reject, CompressionQuality.LowQuality, EncodingType.Png)
    })
}

function decode(encodedString) {
    return new Promise(function (resolve, reject) {
        Base64.decodeTextureAsync(encodedString, resolve, reject)
    })
}

encode(script.texture).then(printEncodedString).catch(printError);