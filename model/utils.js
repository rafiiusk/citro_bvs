sap.ui.define([
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/Text"
], function (Button, Dialog, MessageBox, Text) {
	"use strict";

	return {
		getSubordinadoRouter: function (oThis) {
			oThis = oThis.getOwnerComponent();
			var oItem = "Subordinado" + new Date().getTime();
			oThis.getRouter().addRoute({
				pattern: oItem,
				name: oItem,
				target: "Subordinado",
				targetAggregation: "pages"
			});
			return oItem;
		},
		exibirNaoEncontrado: function (oThis, oTitle, oText, oDescription) {
			if (oThis instanceof sap.ui.core.mvc.Controller) {
				oThis = oThis.getOwnerComponent();
			}
			var oItem = "NotFound" + new Date().getTime();
			oThis.getRouter().addRoute({
				pattern: oItem,
				name: oItem,
				viewPath: "br.embrapa.hcm.commons.zhcm_commons.view",
				view: "NotFound",
				targetAggregation: "pages"
			});

			var oErroModel = new sap.ui.model.json.JSONModel({
				title: oTitle,
				text: oText,
				description: oDescription
			});

			oThis.setModel(oErroModel, "oErroModel");
			oThis.getRouter().navTo(oItem);
		},
		montarConfirmacao: function (oTitle, oText, oOkText, fAction) {
			var dialog = new Dialog({
				title: oTitle,
				type: 'Message',
				content: new Text({
					text: oText
				}),
				beginButton: new Button({
					text: oOkText,
					press: function () {
						dialog.close();
						fAction();
					}
				}),
				endButton: new Button({
					text: 'Cancelar',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			return dialog;

		},

		limparValidacaoCampos: function(oFields,oView){
			oFields.forEach(function (oField) {
				oView.byId(oField).setValueState("None");
			});
			
		},

		validarCampos: function (oView, oFields, oMessage) {
			var that = this;
			var bValidationError = false;

			oFields.forEach(function (oInput) {
				bValidationError = that._validateInput((oView.byId(oInput)) ? oView.byId(oInput) : sap.ui.getCore().byId(oInput)) || bValidationError;
			});

			if (!bValidationError) {
				sap.ui.getCore().getMessageManager().removeAllMessages();
				if (oMessage) {
					if(oView.byId(oMessage)){
						oView.byId(oMessage).setVisible(false);
					}
				}
				return true;
			} else {
				if (oMessage) {
					this.putMessage(oMessage, "Preencher campos obrigatórios",oView);
				} else {
					var vText = "Preencher campos obrigatórios";
					var vTitle = "Ocorreu um erro";
					MessageBox.show(
						vText, {
							icon: MessageBox.Icon.ERROR,
							title: vTitle,
							actions: [MessageBox.Action.OK],
							onClose: function (oAction) {}
						}
					);

				}
				return false;
			}
		},
		putMessage: function (oMessage, oText,oView) {
			var oMs = sap.ui.getCore().byId("msgStrip");
			if (oMs) {
				oMs.destroy();
			}
			var oVC = oView.byId(oMessage);
			var oMsgStrip = new sap.m.MessageStrip("msgStrip", {
				text: oText,
				showCloseButton: true,
				showIcon: true,
				type: "Error"
			});
			oVC.setVisible(true);
			oMsgStrip.attachClose(function () {
				oVC.setVisible(false);
			});
			oVC.addContent(oMsgStrip);

		},
		_validateInput: function (oInput) {
			var sValueState = "None";
			var bValidationError = false;
			var oValueInput = "";
			
			switch("function"){
				case typeof oInput.getValue:
					oValueInput = oInput.getValue();
					break;
				case typeof oInput.getSelectedKey:
					oValueInput = oInput.getSelectedKey();
					break;					
				case typeof oInput.getSelected:
					oValueInput = oInput.getSelected();
					break;										
				default:
					break;
			}
			
			if (oValueInput === "") {
				sValueState = "Error";
				bValidationError = true;
			}
			oInput.setValueState(sValueState);
			return bValidationError;
		},
		cancelNavigation: function (oThis) {
			var oModel = oThis.getView().getModel();
			if (oModel.hasPendingChanges()) {
				var that = this;
				MessageBox.confirm(
					"Deseja realmente cancelar a edição e perder os dados não salvos?", {
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								oModel.resetChanges();
								that.navBack(oThis);
							}
						}
					}
				);
			} else {
				this.navBack(oThis);
			}
		},

		navBack: function (oThis) {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			oThis.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				oThis.getRouter().getTargets().display("MSS");
			}
		},
		checkIfBatchRequestSucceeded: function (oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		}
	};

});