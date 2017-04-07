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


	var CALC_DATA = {
		'fanera': {
			sizes: [
				'1525х1525',
				'2400х1500',
				// '2440x1500',
				'2500х1250',
				'2500х1500',
				'2500х1525',
				'3000х1500',
				'3050х1525',
				'1525х505',
				'1525х250',
				'1525х525',
				'1525х590',

			],

			depths: [
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'10',
				'12',
				'15',
				'16',
				'18',
				'21',
				'27',
				'35',

			]
		},
		'dvp': {
			sizes: [
				'1220х610',
				'2135х1220',
				'2440х1220',
				'2500х1250',
				'2745х1220',
				'2745х1700',
				'3050х1220',

			],

			depths: [
				'2,5',
				'3',
				'3,2',
				'4',
				'5',
				'6',
			]
		},
		'dsp': {
			sizes: [
				'2500х1850',
				'2750х1830',
				'2800х2070',
				'3500х1750',
			],
			depths: [
				'8',
				'10',
				'16',
				'18',
				'22',
				'25',
				'30',
				'35',
				'38',
			]
		},
		'osp': {
			sizes: [
				'2800х1250',
				'2500х1250',
				'2440х1220',
			],
			depths: [
				'6',
				'8',
				'9',
				'10',
				'12',
				'15',
				'18',
				'22',
				'27',
			]
		}
	};

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
		],
		depths: [
		],
	};

	app.controller('mainController', ['$scope', 'safeApply', '$element',
		function mainCalcController($scope, safeApply, $element) {

			$scope.stage = SETTINGS.stage;
			$scope.materials = SETTINGS.materials;
			$scope.sizes = SETTINGS.sizes;
			$scope.depths = SETTINGS.depths;

			var calculator = this;

			function getMaterialParams(materialId) {
				var material = Object.assign({}, CALC_DATA[materialId]);
				material.sizes = material.sizes.map(function(size) { return size.split('х'); });

				return material;
			}

			function setMaterial(materialId) {
				var currentMaterial = getMaterialParams(materialId);

				safeApply($scope, function(){
					$scope.sizes = currentMaterial.sizes;
					$scope.depths = currentMaterial.depths;
				});
			}

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

					if (areaSquare === 0) {
						return 0;
					}

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

			function scrollToBottom(needScroll) {
				if (needScroll) {
					// document.body.scrollTop = document.body.scrollHeight;
					$('html, body').animate({
						scrollTop: document.body.scrollHeight
					}, 300);
				}
			}

			function parametersIsEnough() {
				return calculator.currentStage() >	 2;
			}

			setMaterial('fanera');

			this.currentStage = function getCurrentStage() {
				return $scope.stage.filter(function (item) {
					return item && item.enable;
				}).length;
			};

			this.resetStages = function resetStages() {
				var startStageIdx = 1;
				var delta = this.currentStage() - startStageIdx;

				while (delta > 0) {
					var stageIdx = startStageIdx + delta;
					var previousStageState = $scope.stage[stageIdx] || {enable: true};
					$scope.stage[stageIdx] = Object.assign({}, previousStageState, {value:  0});
					delta -= 1;
				}
			};

			this.showResult = function showResult() {
				return this.currentStage() >= 4;
			};

			var $form = $element.find('form');
			var form = $form[0];

			function setFullResult() {
				if (!parametersIsEnough()) {
					return false;
				}

				if ($scope.stage[1].value === 0) {
					form.elements['capacity-field'].value = count();
				} else {
					var totalSquare = (square(size())  / 1000000) * count();
					form.elements['square-field'].value = Math.ceil(totalSquare);
				}
			}

			this.setStage = function setStage($event, stageIdx, value) {
				if (!Number.isInteger(stageIdx)) {
					if (STAGES.indexOf(stageIdx) < 0) {
						throw new Error('StageIdx argument must be Integer or String  included into STAGES' + STAGES.join(' ,'));
					}
					stageIdx = STAGES.indexOf(stageIdx);
				}

				var previousStageState = $scope.stage[stageIdx] || {enable: true};

				if (STAGES[stageIdx] === 'material') {
					setMaterial($scope.materials[value].id);
					this.resetStages();
				}

				safeApply($scope, function applyStage() {
					var needToScroll = $scope.stage.length - 1 <= stageIdx;
					$scope.stage[stageIdx] = Object.assign({}, previousStageState, { value:  value });
					setTimeout(function() {
						scrollToBottom(needToScroll);
						setFullResult();
					}, 0)
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



			$('#square-field, #capacity-field').on('change input', function () {

				safeApply($scope, function makeDigest() {
					$scope.digest = new Date();
				});
				setFullResult();


			}).on('focus', function () {
				if (this.id === 'square-field') {
					calculator.setStage(null, 1, 0);
				} else if (this.id === 'capacity-field') {
					calculator.setStage(null, 1, 1);
				}
			});

			this.calculateCount = function calculateCount() {
				if (!this.showResult()) {
					return;
				}

				return count();
			};

			this.submitResult = function submitResult ($event) {
				var query = form.action + '?' + $(form).serialize();

				var xhr = new XMLHttpRequest();
				xhr.open('GET', query, true);

				xhr.onreadystatechange = function() { // (3)
					if (xhr.readyState != 4) return;

					if (xhr.status != 200) {
						swal('Заявка принята!', '', 'success');
					} else {
						swal('Ошибка!', '', 'error');
					}
				};

				xhr.send();
				$event.preventDefault();
				return false;
			};

			this.calculateCapacity = function calculateCapacity() {
				if (!parametersIsEnough()) {
					return false;
				}
				// if (!this.showResult()) {
				// 	return;
				// }

				return (cube(size(), depth())  / 1000000) * count();
			};
		}]);


	//use b in some fashion.

	// Just return a value to define the module export.
	// This example returns an object, but the module
	// can return a function as the exported value.
	return MODULE_NAME;
}));
