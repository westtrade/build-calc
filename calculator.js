(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.returnExports = factory();
	}
}(this, function () {
	'use strict';

	var MODULE_NAME = 'buildCalc';
	var STAGES = ['material', 'square', 'size', 'depth'];

	var app = window.angular.module(MODULE_NAME, []);
	app.factory('safeApply', [function() {
		return function($scope, fn) {
			var phase = $scope.$root.$$phase;
			if(phase == '$apply' || phase == '$digest') {
				if (fn) {
					$scope.$eval(fn);
				}
			} else {
				if (fn) {
					$scope.$apply(fn);
				} else {
					$scope.$apply();
				}
			}
		};
	}]);


	var SETTINGS = {
		stage: [],
		materials: [
			{id: 'fanera', title: 'Фанера'},
			{id: 'dsp', title: 'ДСП'},
			{id: 'dvp', title: 'ДВП'},
			{id: 'osp', title: 'ОСП'},
		],
		sizes: [
			[1000, 1000],
			[2500, 1250],
			[2500, 1250],
			[2500, 1250],
			[2500, 1250],
			[2500, 1250],
		],
		depths: [
			3, 4, 5, 6, 8
		],
	};

	app.controller('mainController', ['$scope', 'safeApply', '$element',
		function mainCalcController($scope, safeApply, $element) {

			$scope.stage = SETTINGS.stage;
			$scope.materials = SETTINGS.materials;
			$scope.sizes = SETTINGS.sizes;
			$scope.depths = SETTINGS.depths;

			function count() {
				var currentStage = $scope.stage[STAGES.indexOf('square')];
				if (!currentStage) {
					return 0;
				}

				var value = currentStage.value;

				if (value === 1) {
					return parseInt(document.forms[0].elements['capacity-field'].value);
				} else {
					var areaSquare =
						parseInt(document.forms[0].elements['square-field'].value) * 1000000 ;

					var peaceSquare = square(size());
					var count = Math.ceil(areaSquare / peaceSquare);
					return count;
				}
			}

			function depth() {
				var currentStage = $scope.stage[STAGES.indexOf('depth')];
				if (!currentStage) {
					return 0;
				}

				var value = currentStage.value;
				return $scope.depths[value];
			}

			function size() {
				var currentStage = $scope.stage[STAGES.indexOf('size')];
				if (!currentStage) {
					return 0;
				}

				var value = currentStage.value;
				return $scope.sizes[value];
			}

			function square(size) {
				return size[0] * size[1];
			}

			function cube(size, depths) {
				return (square(size) * depths);
			}

			this.showResult = function showResult() {
				return $scope.stage.filter(function (item) {
					return item && item.enable;
				}).length >= 4;
			};

			this.setStage = function setStage($event, stageIdx, value) {
				if (!Number.isInteger(stageIdx)) {
					if (STAGES.indexOf(stageIdx) < 0) {
						throw new Error('StageIdx argument must be Integer or String  included into STAGES' + STAGES.join(' ,'));
					}
					stageIdx = STAGES.indexOf(stageIdx);
				}

				var previousStageState = $scope.stage[stageIdx] || {enable: true};

				safeApply($scope, function applyStage() {
					$scope.stage[stageIdx] = Object.assign({}, previousStageState, { value:  value });
				});

				if ($event) {
					$event.preventDefault();
					return false;
				}
			};

			this.setComplexStage = function setComplexStage($event, stageIdx, value) {
				var $input = window.angular.element($event.target).find('input');
				if ($input.length) {
					var input = $input[0];
					input.focus();
					input.select();
					// input.setSelectionRange(0, input.value.length);
				}

				this.setStage(null, stageIdx, value);
			};

			var $form = $element.find('form');
			var form = $form[0];

			form.addEventListener('input', function () {
				safeApply($scope, function makeDigest() {
					$scope.digest = new Date();
				});
			}, true);

			form.addEventListener('change', function () {
				safeApply($scope, function makeDigest() {
					$scope.digest = new Date();
				});
			}, true);

			this.calculateCount = function calculateCount() {
				if (!this.showResult()) {
					return;
				}

				return count();
			};

			this.calculateCapacity = function calculateCapacity() {
				if (!this.showResult()) {
					return;
				}

				return (cube(size(), depth())  / 1000000) * count();
			};
		}]);


	//use b in some fashion.

	// Just return a value to define the module export.
	// This example returns an object, but the module
	// can return a function as the exported value.
	return MODULE_NAME;
}));
