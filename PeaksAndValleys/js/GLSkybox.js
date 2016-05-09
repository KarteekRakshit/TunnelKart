/*
- Copyright (c) 2012 Research In Motion Limited.
-
- Licensed under the Apache License, Version 2.0 (the "License");
- you may not use this file except in compliance with the License.
- You may obtain a copy of the License at
-
- http://www.apache.org/licenses/LICENSE-2.0
-
- Unless required by applicable law or agreed to in writing, software
- distributed under the License is distributed on an "AS IS" BASIS,
- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
- See the License for the specific language governing permissions and
- limitations under the License.
*/

/*global console, Image, assets, gl, Float32Array, Uint16Array, Uint8Array, mat4, vec3 */

/**
 * GLSkybox.js provides a basic, textured skybox that can be positioned to follow our camera.
 * Here we get our initialization and rendering functionality in one convenient object.
 */

var GLSkybox = function (gl) {
	'use strict';
	var vertices, coords, indices;

	try {
		/* Initialize our shader. */
		this.initShader();

		/* Initialize our texture. */
		this.initTexture();

		/* Vertices will always be the same. Coordinates range from -1.0 to 1.0 and create a cube. */
		vertices = [
			-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, /* Front */
		    1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, /* Back */
			-1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, /* Top */
			-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, /* Bottom */
			-1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, /* Left */
			1.0, -1.0, -1.0, 1.0, -1.0,  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0  /* Right */
		];

		/**
		 * Texture coordinates depend on the layout of the texture sections within the image. The defined
		 * layout expects a texture along the lines of:
		 *
		 * EM TO EM EM
		 * LE FR RI BA
		 * EM BO EM EM
		 * EM EM EM EM
		 *
		 * Where: BO = Bottom, TO = Top, EM = Empty, LE = Left, FR = Front, RI = Right, and BA = Back
		 * - These refer to the faces of the cube that we generate.
		 */
		coords = [
			0.25, 0.50,   0.50, 0.50,   0.50, 0.75,   0.25, 0.75, /* Front */
			0.75, 0.50,   1.00, 0.50,   1.00, 0.75,   0.75, 0.75, /* Back */
			0.25, 0.75,   0.50, 0.75,   0.50, 1.00,   0.25, 1.00, /* Top */
			0.25, 0.25,   0.50, 0.25,   0.50, 0.50,   0.25, 0.50, /* Bottom */
			0.00, 0.50,   0.25, 0.50,   0.25, 0.75,   0.00, 0.75, /* Left */
			0.50, 0.50,   0.75, 0.50,   0.75, 0.75,   0.50, 0.75  /* Right */
		];

		/* Indices will always be the same to account for a TRIANGLE_LIST. */
		indices = [
			0, 1, 2, 0, 2, 3, /* Front */
			4, 5, 6, 4, 6, 7, /* Back */
			8, 9, 10, 8, 10, 11, /* Top */
			12, 13, 14, 12, 14, 15, /* Bottom */
			16, 17, 18, 16, 18, 19, /* Left */
			20, 21, 22, 20, 22, 23  /* Right */
		];

		/* Bind the vertex buffer. */
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 24;

		/* Bind the texture buffer. */
		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 24;

		/* Bind the index buffer. */
		this.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.iBuffer.itemSize = 1;
		this.iBuffer.numItems = 36;

		/* Initialize our terrain variables. */
		this.mMatrix = mat4.create();
		this.mvMatrix = mat4.create();
		this.position = vec3.create([0.0, 0.0, 0.0]);
	} catch (err) {
		console.log("GLSkybox: " + err);
	}
};

GLSkybox.prototype.initShader = function () {
	'use strict';
	var shader, fragment, vertex;

	/* Retrieve our defined shaders. */
	shader = gl.createProgram();
	fragment = assets.getShader(gl, './shaders/GLSkyboxF.c', gl.FRAGMENT_SHADER);
	vertex = assets.getShader(gl, './shaders/GLSkyboxV.c', gl.VERTEX_SHADER);

	/* Attach our shaders. */
	gl.attachShader(shader, fragment);
	gl.attachShader(shader, vertex);
	gl.linkProgram(shader);
	gl.useProgram(shader);

	/* Retrieve the aVertexPosition variable location. */
	shader.vertexPositionAttribute = gl.getAttribLocation(shader, 'aVertexPosition');
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);

	/* Retrieve the aVertexCoords variable location. */
	shader.vertexCoordsAttribute = gl.getAttribLocation(shader, 'aVertexCoords');
	gl.enableVertexAttribArray(shader.vertexCoordsAttribute);

	/* Retrieve our uniform locations. */
	shader.pMatrixUniform = gl.getUniformLocation(shader, 'uPMatrix');
	shader.mvMatrixUniform = gl.getUniformLocation(shader, 'uMVMatrix');
	shader.samplerUniform = gl.getUniformLocation(shader, 'uSampler');

	this.shader = shader;
};

GLSkybox.prototype.initTexture = function () {
	'use strict';
	var _this, image;

	_this = this;

	/* Skybox texture. */
	this.texture = gl.createTexture();

	/* Default colour until texture is loaded. */
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 200, 255]));

	/* Load our image. */
	image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, _this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	image.src = "./images/skybox/skybox.png";
};

GLSkybox.prototype.render = function (pMatrix, vMatrix) {
	'use strict';

	/* Reset our model matrix, rotate our model, and position our model. */
	mat4.identity(this.mMatrix);
	mat4.translate(this.mMatrix, this.position);

	/* Disable depth testing. */
	gl.disable(gl.DEPTH_TEST);

	/* Set our shader and geometry. */
	gl.useProgram(this.shader);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
	gl.vertexAttribPointer(this.shader.vertexPositionAttribute, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
	gl.vertexAttribPointer(this.shader.vertexCoordsAttribute, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

	/* Activate the skybox texture. */
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.uniform1i(this.shader.samplerUniform, 0);

	/* We will be rendering from our index buffer. */
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);

	/* Set our projection matrix. */
	gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);

	/* Set our model-view matrix. */
	mat4.multiply(vMatrix, this.mMatrix, this.mvMatrix);
	gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, this.mvMatrix);

	/* Render our terrain. */
	gl.drawElements(gl.TRIANGLES, this.iBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	/* Re-enable depth testing. */
	gl.enable(gl.DEPTH_TEST);
};