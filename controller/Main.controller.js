sap.ui.define([
	"sap/m/MessageToast",
	"sap/ui/core/mvc/Controller",
	"br/citrosuco/tm/ZUI5_TM_VESSEL/model/utils",
	"br/citrosuco/tm/ZUI5_TM_VESSEL/model/formatter"
], function(MessageToast, Controller, Utils, formatter) {
	"use strict";

	return Controller.extend("br.citrosuco.tm.ZUI5_TM_VESSEL.controller.Main", {

		formatter: formatter,

		onInit: function() {
			this.oTable = this.byId("table");
			this.oTable.setModel(this.getModel());
			this.oTanksModel = this.getOwnerComponent().getModel('tanks');
			this.getView().setModel(this._createViewModel(), "masterView");
			var sTitle = this.getResourceBundle().getText("tableTitleCount") + " (0)";
			this.getView().byId("titleTable").setText(sTitle);
			this.getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this.getModel().attachRequestSent(function() {
				this.getModel("masterView").setProperty("/busy", true);
			}, this);
			this.getModel().attachRequestCompleted(function() {
				this.getModel("masterView").setProperty("/busy", false);
			}, this);
		},

		_onMetadataLoaded: function() {

			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("masterView");

			oViewModel.setProperty("/delay", 0);

			oViewModel.setProperty("/busy", true);

			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		getModel: function() {
			return this.getOwnerComponent().getModel();
		},

		_createViewModel: function() {
			return new sap.ui.model.json.JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				busy: false,
				delay: 0,
				tableTitle: this.getResourceBundle().getText("tableTitleCount", "0"),
				noDataText: this.getResourceBundle().getText("tableNoDataText"),
				sortBy: "Name1",
				groupBy: "None",
				tankSelectMode: sap.m.ListMode.SingleSelectMaster,
				tankItemPress: true,
				newTanksVisible: true

			});
		},

		onUpdateTableVesselFinished: function(oEvent) {
			var sTitle;
			if (this.oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("tableTitleCount") + " (" + oEvent.getParameter("total") + ")";
				this.getView().byId("titleTable").setText(sTitle);
			}
		},

		onUpdateTableTanksFinished: function() {
			var sTitle;
			if (sap.ui.getCore().byId("tanksTable")) {
				if (sap.ui.getCore().byId("tanksTable").getBindingInfo("items").binding) {
					// if (sap.ui.getCore().byId("tanksTable").getBindingInfo("items").binding.bLengthFinal) {
					// 	sTitle = this.getResourceBundle().getText("tableTitleTanksCount") + " (" + oEvent.getParameter("total") + ")";
					// 	sap.ui.getCore().byId("titleTanksTable").setText(sTitle);
					// 	if (sap.ui.getCore().byId("btnVesselQtdeTanque")) {
					// 		sap.ui.getCore().byId("btnVesselQtdeTanque").setText(oEvent.getParameter("total"));
					// 	}
					// } else {
					var iLength = sap.ui.getCore().byId("tanksTable").getBindingInfo("items").binding.iLength;
					sTitle = this.getResourceBundle().getText("tableTitleTanksCount") + " (" + iLength + ")";
					sap.ui.getCore().byId("titleTanksTable").setText(sTitle);
					//sap.ui.getCore().byId("btnVesselQtdeTanque").setText(iLength);
					if (sap.ui.getCore().byId("btnVesselQtdeTanque")) {
						sap.ui.getCore().byId("btnVesselQtdeTanque").setText(iLength);
					}
					//}
				}
			}
		},

		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		_VesselHandleValueHelpSearch: function(e) {
			var sQuery = e.getParameter("query");
			this.oTable.getBinding("items").filter([new sap.ui.model.Filter("Ivessel", "EQ", sQuery)], "Application");
		},

		onTankSearch: function(e) {
			if (e.getParameters().refreshButtonPressed) {
				this.selTanksDialog._oList.getBinding("items").filter([new sap.ui.model.Filter("Vessel", "EQ", this._getVessel().CodEmbrc)]);
				return;
			}
			var sQuery = e.getParameter("value");
			this.selTanksDialog._oList.getBinding("items").filter([new sap.ui.model.Filter("Shtank", "EQ", sQuery)]);
		},

		// INICIO NEW TANKS		

		onConfirmNewTank: function() {
			if (this._validar(["inpTankCodEmbrc", "inpTankNomeEmbrc", "inpTankHatch", "inpTankTanque"], "msgNewTanks")) {
				var oTank = {
					CodEmbrc: sap.ui.getCore().byId("inpTankCodEmbrc").getValue(),
					NomeEmbrc: sap.ui.getCore().byId("inpTankNomeEmbrc").getValue(),
					Hatch: sap.ui.getCore().byId("inpTankHatch").getValue(),
					Tanque: sap.ui.getCore().byId("inpTankTanque").getValue(),
					Capacidade: sap.ui.getCore().byId("inpTankCapacidade").getValue(),
					Type: "",
					Message: ""
				};
				this._setVessel(undefined, [oTank]);
				//this._setTanks([oTank]);
				if (this.newTanksDialog) {
					this.newTanksDialog.setBusy(false);
					this.onCancelNewTanks();
				}
			}
		},

		onCancelNewTanks: function() {
			if (this.newTanksDialog) {
				this.newTanksDialog.close();
				this.newTanksDialog.destroy(true);
				this.getView().removeAllDependents();
				this.newTanksDialog = undefined;
			}
		},

		getNewTanksDialog: function() {
			if (!this.newTanksDialog) {
				this.newTanksDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.newTanks", this);
				this.getView().addDependent(this.newTanksDialog);
			}
			return this.newTanksDialog;
		},

		openNewTanksDialog: function() {
			this.onCancelNewTanks();
			this.getNewTanksDialog();
			var oList = sap.ui.getCore().byId("tanksTable");
			if (oList) {
				if (oList.getModel().getData()) {
					if (oList.getModel().getData().Tanks[0].CodEmbrc !== "") {
						sap.ui.getCore().byId("inpTankCodEmbrc").setValue(oList.getModel().getData().Tanks[0].CodEmbrc);
					} else {
						if (oList.getModel().getData().Tanks[0].Code !== "") {
							sap.ui.getCore().byId("inpTankCodEmbrc").setValue(oList.getModel().getData().Tanks[0].Code);
						}
					}
					if (oList.getModel().getData().Tanks[0].NomeEmbrc !== "") {
						sap.ui.getCore().byId("inpTankNomeEmbrc").setValue(oList.getModel().getData().Tanks[0].NomeEmbrc);
					} else {
						if (oList.getModel().getData().Tanks[0].Code !== "") {
							sap.ui.getCore().byId("inpTankCodEmbrc").setValue(oList.getModel().getData().Tanks[0].Name);
						}
					}
				}
				if (sap.ui.getCore().byId("inpVesselCode")) {
					var sVesselCode = sap.ui.getCore().byId("inpVesselCode").getValue();
					sap.ui.getCore().byId("inpTankCodEmbrc").setValue(sVesselCode);
					var sVesselName = sap.ui.getCore().byId("inpVesselName").getValue();
					sap.ui.getCore().byId("inpTankNomeEmbrc").setValue(sVesselName);
				}
			}
			this.getNewTanksDialog().open();
		},

		// FIM NEW TANKS	

		// INICIO CHANGE TANKS	

		onConfirmChangeTank: function() {
			if (this._validar(["inpTankCodEmbrc", "inpTankNomeEmbrc", "inpTankHatch", "inpTankTanque"], "msgChangeTanks")) {
				var oTank = {
					CodEmbrc: sap.ui.getCore().byId("inpTankCodEmbrc").getValue(),
					NomeEmbrc: sap.ui.getCore().byId("inpTankNomeEmbrc").getValue(),
					Hatch: sap.ui.getCore().byId("inpTankHatch").getValue(),
					Tanque: sap.ui.getCore().byId("inpTankTanque").getValue(),
					Capacidade: sap.ui.getCore().byId("inpTankCapacidade").getValue(),
					Type: "",
					Message: ""
				};
				if (this.changeTanksDialog) {
					this.changeTanksDialog.setBusy(true);
				}
				this.getModel().create("/TankSet", oTank, {
					success: function(oData) {
						sap.m.MessageToast.show(oData.Message);
						if (this.changeTanksDialog) {
							this.changeTanksDialog.setBusy(false);
							this.onCancelChangeTanks();
						}
						this.getTanksDialog().close();
						//this.refreshList(sap.ui.getCore().byId("tanksTable"));
						this.refreshList(this.oTable);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageToast.show(oError.message);
						if (this.changeTanksDialog) {
							this.changeTanksDialog.setBusy(false);
							this.onCancelChangeTanks();
						}
					}.bind(this)
				});
			}
		},

		onCancelChangeTanks: function() {
			if (this.changeTanksDialog) {
				this.changeTanksDialog.close();
				this.changeTanksDialog.destroy(true);
				this.getView().removeAllDependents();
				this.changeTanksDialog = undefined;
			}
		},

		getChangeTanksDialog: function() {
			if (!this.changeTanksDialog) {
				this.changeTanksDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.changeTanks", this);
				this.getView().addDependent(this.changeTanksDialog);
			}
			return this.changeTanksDialog;
		},

		openChangeTanksDialog: function(oLine) {
			this.getChangeTanksDialog();
			var oList = sap.ui.getCore().byId("tanksTable");
			if (oList) {
				var sCode = "";
				var sName = "";
				if (oList.getModel().getData().Tanks[oLine].CodEmbrc !== "") {
					sCode = oList.getModel().getData().Tanks[oLine].CodEmbrc;

				} else {
					if (oList.getModel().getData().Tanks[oLine].Code !== "") {
						sCode = oList.getModel().getData().Tanks[oLine].Code;
					}
				}
				if (oList.getModel().getData().Tanks[oLine].NomeEmbrc !== "") {
					sName = oList.getModel().getData().Tanks[oLine].NomeEmbrc;
				} else {
					if (oList.getModel().getData().Tanks[oLine].Code !== "") {
						sName = oList.getModel().getData().Tanks[oLine].Nome;
					}
				}

				var sHatch = oList.getModel().getData().Tanks[oLine].Hatch;
				var sTanque = oList.getModel().getData().Tanks[oLine].Tanque;
				var sCapacidade = oList.getModel().getData().Tanks[oLine].Capacidade;

				sap.ui.getCore().byId("inpTankCodEmbrc").setValue(sCode);
				sap.ui.getCore().byId("inpTankNomeEmbrc").setValue(sName);
				sap.ui.getCore().byId("inpTankHatch").setValue(sHatch);
				sap.ui.getCore().byId("inpTankTanque").setValue(sTanque);
				sap.ui.getCore().byId("inpTankCapacidade").setValue(sCapacidade);

				if (sap.ui.getCore().byId("inpVesselCode")) {
					var sVesselCode = sap.ui.getCore().byId("inpVesselCode").getValue();
					sap.ui.getCore().byId("inpTankCodEmbrc").setValue(sVesselCode);
					var sVesselName = sap.ui.getCore().byId("inpVesselName").getValue();
					sap.ui.getCore().byId("inpTankNomeEmbrc").setValue(sVesselName);
				}
			}
			
			var sContext = "/TankSet(CodEmbrc='" + sCode + "',Hatch='" + sHatch + "',Tanque='" + sTanque +"')";
			
			this.getChangeTanksDialog().bindElement({
				path:sContext
			});
			
			this.oTanksModel.setProperty("/SelLine", oLine);
			
			this.getChangeTanksDialog().open();
		},

		// FIM CHANGE TANKS		

		onDeleteTank: function(e) {
			this.getChangeTanksDialog().setBusy(true);
			this.getModel().remove(e.getSource().getBindingContext().getPath(), {
				success: function() {
					//sap.m.MessageToast.show(oData.Message);
					if (this.changeTanksDialog) {
						this.changeTanksDialog.setBusy(false);
					}
					var aNewTanks = [];
					var aOldTanks = this.oTanksModel.getData().Tanks;
					var oDeletedLine = parseInt(this.oTanksModel.getProperty("/SelLine"));
					for(var i=0; i<=aOldTanks.length; i++){
						if(i !== oDeletedLine){
							aNewTanks.push(aOldTanks[i]);
						}
					}
					this.oTanksModel.setData({
						Tanks : aNewTanks
					});
					this.oTanksModel.refresh(true);
					this.onUpdateTableTanksFinished();
					//sap.ui.getCore().byId("tanksTable").getModel().refresh();
					this.onCancelChangeTanks();
					this.getModel().refresh(true);
				}.bind(this),
				error: function(oError) {
					sap.m.MessageToast.show(oError.message);
					if (this.changeTanksDialog) {
						this.changeTanksDialog.setBusy(false);
					}
				}.bind(this)
			});
		},

		onCancelTanks: function() {
			if (this.tanksDialog) {
				this.tanksDialog.destroy(true);
				this.getView().getDependents();
				this.tanksDialog = undefined;
			}
			this.oTanksModel.setData({
				Tanks: []
			});
		
		},

		getTanksDialog: function() {
			if (!this.tanksDialog) {
				this.tanksDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.tanks", this);
				this.getView().addDependent(this.tanksDialog);
			}
			return this.tanksDialog;
		},

		openTanksDialog: function(e) {
			var t = this;
			var sText = this.getResourceBundle().getText("addVessel");
			//var oList = sap.ui.getCore().byId("tanksTable");
			if (e.getParameter("id") === "btnVesselQtdeTanque") {
				this.getView().getModel("masterView").setProperty("/tankSelectMode", sap.m.ListMode.SingleSelectMaster);
				this.getView().getModel("masterView").setProperty("/tankItemPress", true);
				this.getView().getModel("masterView").setProperty("/newTanksVisible", true);
			} else {
				this.getView().getModel("masterView").setProperty("/tankSelectMode", sap.m.ListMode.None);
				this.getView().getModel("masterView").setProperty("/tankItemPress", false);
				this.getView().getModel("masterView").setProperty("/newTanksVisible", false);

			}
			
			if (e.getSource().getBindingContext()) {
				sText = this.getResourceBundle().getText("title") + ": " + e.getSource().getBindingContext().getObject().Code;
				this.getTanksDialog().setBusy(true);
				this.getModel().read(e.getSource().getBindingContext().getPath() + "/Tanks", {
					async: false,
					success: function(oData) {
						if (oData.results.length > 0) {
							t._setTanks(oData.results, true);
							t.getTanksDialog().setBusy(false);
						}
					}
				});
				// oList.setModel(this.getModel());
				// oList.bindItems({
				// 	path: e.getSource().getBindingContext().getPath() + "/Tanks",
				// 	template: oList.getBindingInfo("items").template
				// });
			} else {
				// if (sap.ui.getCore().byId("inpVesselCode")) {
				// 	//var sVesselCode = sap.ui.getCore().byId("inpVesselCode").getValue();
				// 	if (!this._validar()) {
				// 		return;
				// 	}
				// 	sText = this.getResourceBundle().getText("title") + ": " + sap.ui.getCore().byId("inpVesselCode").getValue();
				// 	oList.setModel(this.oTanksModel);
				// 	oList.bindItems({
				// 		path: "/Tanks",
				// 		template: oList.getBindingInfo("items").template
				// 	});
				// }
			}
			this.getTanksDialog().open();
			this.getTanksDialog().setTitle(sText);
			var sTitle = this.getResourceBundle().getText("tableTitleTanksCount") + " (0)";
			sap.ui.getCore().byId("titleTanksTable").setText(sTitle);
		},

		refreshList: function(oList) {
			if (oList) {
				oList.bindItems({
					path: oList.getBindingInfo("items").path,
					template: oList.getBindingInfo("items").template
				});
			}
		},

		setBloquedItems: function(oList) {
			var header = oList.$().find('thead');
			var selectAllCb = header.find('.sapMCb');
			selectAllCb.remove();
			oList.getItems().forEach(function(r) {
				var cb = r.$().find('.sapMCb');
				var oCb = sap.ui.getCore().byId(cb.attr('id'));
				oCb.setEnabled(false);
			});
		},

		_getVessel: function(oAction) {
			if (!this._sVessel) {
				this._setVessel(undefined,undefined,oAction);
			}
			return this._sVessel;
		},

		_setVessel: function(oVessel, oTank,oAction) {
			if (oTank) {
				this._setTanks(oTank);
			}
			if (oVessel) {
				this._sVessel = {
					CodEmbrc: oVessel.CodEmbrc,
					Type: "",
//					Message: "",
					NomeEmbrc: oVessel.NomeEmbrc,
					AnoFab: oVessel.AnoFab,
					ServicoDesde: oVessel.ServicoDesde,
//					Action: oVessel.Action,
					Email: oVessel.Email,
					Fone: oVessel.Fone,
					Fax: oVessel.Fax,
					ViagemAtual: oVessel.ViagemAtual,
					Priority: oVessel.Priority,
					BlockRec: oVessel.BlockRec,
					Ivessel: oVessel.Ivessel,
					Tanks: this._getTanks()
				};
			} else {
				if (sap.ui.getCore().byId("inpVesselCode")) {
					this._sVessel = {
						CodEmbrc: sap.ui.getCore().byId("inpVesselCode").getValue(),
						Type: "",
//						Message: "",
						NomeEmbrc: sap.ui.getCore().byId("inpVesselName").getValue(),
						AnoFab: sap.ui.getCore().byId("dtVesselAnoFab").getDateValue(),
						ServicoDesde: sap.ui.getCore().byId("dtVesselIServicoDesde").getDateValue(),
//						Action: oAction,
						Email: sap.ui.getCore().byId("inpVesselEmail").getValue(),
						Fone: sap.ui.getCore().byId("inpVesselFone").getValue(),
						Fax: sap.ui.getCore().byId("inpVesselFax").getValue(),
						ViagemAtual: sap.ui.getCore().byId("inpVesselViagemAtual").getValue(),
						Priority: sap.ui.getCore().byId("inpPriority").getValue(),
						BlockRec: "",
						Ivessel: "",
						Tanks: this._getTanks()
					};
				}
			}
		},

		_getTanks: function() {
			if (!this._aTanks) {
				this._setTanks();
			}
			return this._aTanks;
		},

		_setTanks: function(aTanks, initialLoad) {
			this._aTanks = [];
			if (aTanks) {
				aTanks.forEach(function(oItem) {
					this._aTanks.push({
						CodEmbrc: oItem.CodEmbrc,
						NomeEmbrc: oItem.NomeEmbrc,
						Hatch: oItem.Hatch,
						Tanque: oItem.Tanque,
						Capacidade: oItem.Capacidade,
						Type: "",
						Message: ""
					});
				}, this);
			}
			if (!initialLoad) {
				var oOldTanks = this.oTanksModel.getData().Tanks;
				if (oOldTanks && oOldTanks.length > 0) {
					oOldTanks.forEach(function(oItem) {
						this._aTanks.push({
							CodEmbrc: oItem.CodEmbrc,
							NomeEmbrc: oItem.NomeEmbrc,
							Hatch: oItem.Hatch,
							Tanque: oItem.Tanque,
							Capacidade: oItem.Capacidade,
							Type: "",
							Message: ""
						});
					}, this);
				}
			} 
			this.oTanksModel.setData({
				Tanks: this._aTanks
			});
			var oList = sap.ui.getCore().byId("tanksTable");
			if(oList){
				oList.setModel(this.oTanksModel);
				oList.bindItems({
					path: "/Tanks",
					template: oList.getBindingInfo("items").template
				});
			}
			this.oTanksModel.refresh(true);
			this.onUpdateTableTanksFinished();
		},

		onLockUnlock: function(e) {
			var t = this,
				sText = "",
				sTitle = "";
			this._setVessel(e.getSource().getBindingContext().getObject());
			if (this._sVessel.BlockRec === "") {
				this._sVessel.BlockRec = "X";
				sText = this.getResourceBundle().getText("lockVessel") + " " + this._sVessel.Code + "?";
				sTitle = this.getResourceBundle().getText("lock");
			} else {
				this._sVessel.BlockRec = "";
				sText = this.getResourceBundle().getText("unlockVessel") + " " + this._sVessel.Code + "?";
				sTitle = this.getResourceBundle().getText("unlock");
			}
			sap.m.MessageBox.show(sText, {
				icon: sap.m.MessageBox.Icon.QUESTION,
				title: sTitle,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction !== "CANCEL") {
						if (oAction === "YES") {
							t.actionVessel("B"); //Bloq / Desbloq
						}
					}
				}
			});
		},

		getChangeVesselDialog: function() {
			if (!this.changeVesselDialog) {
				this.changeVesselDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.changeVessel", this);
				this.getView().addDependent(this.changeVesselDialog);
			}
			return this.changeVesselDialog;
		},

		onTableItemTanksPressed: function(e) {
			if (this.getView().getModel("masterView").getProperty("/tankItemPress")) {
				var sContext = e.getParameter("listItem").getBindingContext();
				this.openChangeTanksDialog(sContext.getPath().replace("/Tanks/", ""));
			}
		},

		onTableItemPressed: function(e) {
			var sContext = e.getParameter("listItem").getBindingContext();
			this.getChangeVesselDialog().bindElement({
				path: sContext.getPath()
			});
			this.getChangeVesselDialog().setModel(new sap.ui.model.json.JSONModel({
				SelectedVesselCode: sContext.getObject().Code,
				SelectedVesselName: sContext.getObject().Name
			}), "vessel");
			this.getChangeVesselDialog().open();
		},

		openNewVesselDialog: function() {
			this.getNewVesselDialog().setModel(new sap.ui.model.json.JSONModel({
				SelectedVesselCode: "Novo",
				SelectedVesselName: "Novo"
			}), "vessel");
			this.getNewVesselDialog().open();
		},

		getNewVesselDialog: function() {
			if (!this.newVesselDialog) {
				this.newVesselDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.newVessel", this);
				this.getView().addDependent(this.newVesselDialog);
			}
			return this.newVesselDialog;
		},

		onConfirmNewVessel: function() {
			var oInpVessel = sap.ui.getCore().byId("inpVesselCode");
			var sContext = this.getModel().getProperty("/VesselSet('" + oInpVessel + "')");
			if (!sContext) {
				this.actionVessel("C");
			} else {
				if (oInpVessel) {
					oInpVessel.setValueState("Error");
				}
				return Utils.putMessage("msgChangeVessel", this.getResourceBundle().getText("vesselExist"), sap.ui.getCore());
			}
		},

		onCancelNewVessel: function() {
			if (this.newVesselDialog) {
				this.newVesselDialog.close();
				this.newVesselDialog.destroy(true);
				this.getView().removeAllDependents();
				this.newVesselDialog = undefined;
			}
			this.oTanksModel.setData({
				Tanks: []
			});
			this.oTanksModel.refresh(true);
		},

		onLiveVesselCode: function(e) {
			sap.ui.getCore().byId("dialogNewVessel").setTitle(e.getParameter('value'));
		},

		onConfirmChangeVessel: function() {
			this.actionVessel("M");
		},

		onCancelChangeVessel: function() {
			if (this.changeVesselDialog) {
				this.changeVesselDialog.close();
				this.changeVesselDialog.destroy(true);
				this.getView().removeAllDependents();
				this.changeVesselDialog = undefined;
			}
		},

		_validar: function(aFields, oMsg) {
			if (!aFields) {
				aFields = ["inpVesselCode",
					"inpVesselName",
					"inpPriority",
					"dtVesselAnoFab",
					"dtVesselIServicoDesde",
					"inpVesselViagemAtual"
				];
			}
			return Utils.validarCampos(sap.ui.getCore(), aFields, oMsg);
		},

		actionVessel: function(oAction) {
			// C	Create 
			// M	Modify 
			// B	Bloq
			switch (oAction) {
				case "C":
					this._getVessel(oAction);
					if (!this._validar(null, "msgNewVessel")) {
						return;
					}
					if (this._sVessel.Tanks && this._sVessel.Tanks.length < 1) {
						Utils.putMessage("msgNewVessel", this.getResourceBundle().getText("infTanks"), sap.ui.getCore());
						return;
					}
					this._sVessel.Action = "C";
					this.getNewVesselDialog().setBusy(true);
					break;
				case "M":
					this._getVessel();
					if (this._sVessel.Tanks && this._sVessel.Tanks.length < 1) {
						if (sap.ui.getCore().byId("btnVesselQtdeTanque").getText() === "0") {
							sap.m.MessageToast.show(this.getResourceBundle().getText("infTanks"));
							return;
						}
					}
					this._sVessel.Action = "M";
					this.getChangeVesselDialog().setBusy(true);
					break;
				case "B":
					this._sVessel.Action = "B";
					break;
			}

			this.getModel().create("/VesselSet", this._sVessel, {
				success: function(oData) {
					this._sucess(oData);
				}.bind(this),
				error: function(oError) {
					this._failed(oError);
				}.bind(this)
			});

		},

		_sucess: function(oData) {
			sap.m.MessageToast.show(oData.Message);

			if (this.changeVesselDialog) {
				this.changeVesselDialog.setBusy(false);
			}
			if (this.newVesselDialog) {
				this.newVesselDialog.setBusy(false);
			}
			if (oData.Type !== 'E') {
				//if (oData.Type !== 'S') {
				this.onCancelNewVessel();
				this.onCancelChangeVessel();
				this.refreshList(this.oTable);
				//}
			}
		},

		_failed: function(oError) {
			sap.m.MessageToast.show(oError.message);
			if (this.changeVesselDialog) {
				this.changeVesselDialog.setBusy(false);
			}
			if (this.newVesselDialog) {
				this.newVesselDialog.setBusy(false);
			}
		},

		openTimeZoneDialog: function() {
			this.getTimeZoneDialog().open();
		},

		getTimeZoneDialog: function() {
			if (!this.shTimeZoneDialog) {
				this.shTimeZoneDialog = sap.ui.xmlfragment("br.citrosuco.tm.ZUI5_TM_VESSEL.fragments.shTimeZone", this);
				this.getView().addDependent(this.shTimeZoneDialog);
			}
			return this.shTimeZoneDialog;
		},

		_TimeZoneSHConfirm: function(e) {
			var sTimeZone = e.getParameter("selectedItem").getBindingContext().getObject();
			if (sap.ui.getCore().byId("inpTimeZone")) {
				sap.ui.getCore().byId("inpTimeZone").setValue(sTimeZone.Tzone);
			}
		},

		_TimeZoneSHSearch: function(e) {
			var sQuery = e.getParameter("value");
			var oFilter = [new sap.ui.model.Filter("Tzone", sap.ui.model.FilterOperator.Contains, sQuery)];
			//this.getTimeZoneDialog().getBinding("items").filter(oFilter);
			this.getTimeZoneDialog()._oList.getBinding("items").filter(oFilter);
			//this.oTable.getBinding("items").filter([new sap.ui.model.Filter("Shport", "EQ", sQuery)], "Application");
		},

		_TimeZoneSHCancel: function() {
			if (this.shTimeZoneDialog) {
				//this.shTimeZoneDialog.close();
				this.shTimeZoneDialog.destroy(true);
				this.getView().removeAllDependents();
				this.shTimeZoneDialog = undefined;
			}
		}

	});
});