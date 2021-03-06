define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/event",
	"dojo/query",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/_base/Deferred",
	"dojo/keys",
	"../core/_Module",
	"../core/util",
	"./RowHeader"
], function(declare, array, event, query, lang, domClass, Deferred, keys, _Module, util){

/*=====
	return declare(_Module, {
		// summary:
		//		Provide a check box (or radio button) column to select rows.
		// description:
		//		This module depends on "rowHeader" and "selectRow" modules.

		// position: Integer
		position: 0,

		// width: String
		width: '20px',

		// all: Boolean
		all: true,
	});
=====*/

	var indirectSelectColumnId = '__indirectSelect__';

	return declare(_Module, {
		name: 'indirectSelect',

		required: ['selectRow'],

		position: 0,

		width: '20px',

		all: true,

		preload: function(){
			var t = this,
				g = t.grid,
				sr = g.select.row,
				columns = g._columns,
				w = t.arg('width'),
				col = {
					id: indirectSelectColumnId,
					decorator: lang.hitch(this, '_createSelector'),
					headerStyle: 'text-align: center;',
					style: 'text-align: center;',
					rowSelectable: true,
					sortable: false,
					filterable: false,
					editable: false,
					padding: false,
					ignore: true,
					declaredWidth: w,
					width: w
				};
			t.batchConnect(
				[sr, 'onHighlightChange', '_onHighlightChange' ],
				[sr, 'onSelectionChange', '_onSelectionChange'],
				[sr, 'clear', '_onClear'],
				g.filter && [g.filter, 'onFilter', '_onSelectionChange'],
				[g.body, 'onMoveToCell', function(r, c, e){
					var evt = {
						columnId: indirectSelectColumnId
					};
					if(g._columns[c].id == indirectSelectColumnId){
						t._onMouseOver(evt);
					}else{
						t._onMouseOut();
					}
				}],
				[g, 'onCellMouseOver', '_onMouseOver'],
				[g, 'onCellMouseOut', '_onMouseOut']);
			columns.splice(t.arg('position'), 0, col);
			g._columnsById[col.id] = col;
			array.forEach(columns, function(c, i){
				c.index = i;
			});
			if(sr.selectByIndex && t.arg('all')){
				t._allSelected = {};
				col.name = t._createSelectAllBox();
				t.connect(g, 'onHeaderCellMouseDown', function(e){
					if(e.columnId == indirectSelectColumnId){
						t._onSelectAll();
					}
				});
				t.connect(g, 'onHeaderCellKeyDown', function(e){
					if(e.columnId == indirectSelectColumnId && e.keyCode == keys.SPACE){
						event.stop(e);
						t._onSelectAll();
					}
				});
			}
			g.header._build();
		},

		_createSelectAllBox: function(){
			return this._createCheckBox(this._allSelected[this._getPageId()]);
		},

		_getPageId: function(){
			return this.grid.view.rootStart + ',' + this.grid.view.rootCount;
		},

		_createSelector: function(data, rowId){
			var mark = this.model.getMark(rowId);
				isUnselectable = !this.grid.row(rowId, 1).isSelectable();
			return this._createCheckBox(mark === true, mark == 'mixed', isUnselectable);
		},

		_createCheckBox: function(selected, partial, isUnselectable){
			var dijitClass = this._getDijitClass();
			return ['<span role="', this._isSingle() ? 'radio' : 'checkbox',
				'" class="gridxIndirectSelectionCheckBox dijitReset dijitInline ',
				dijitClass, ' ',
				selected ? dijitClass + 'Checked' : '',
				partial ? dijitClass + 'Partial' : '',
				isUnselectable && selected ? dijitClass + 'CheckedDisabled' : '',
				isUnselectable && partial ? dijitClas  + 'PartialDisabled' : '',
				isUnselectable && !selected && !partial ? dijitClass + 'Disabled' : '',
				'" aria-checked="', selected ? 'true' : partial ? 'mixed' : 'false',
				'"><span class="gridxIndirectSelectionCheckBoxInner">',
				selected ? '&#10003;' : partial ? '&#9646;' : '&#9744;',
				'</span></span>'
			].join('');
		},

		_getDijitClass: function(){
			return this._isSingle() ? 'dijitRadio' : 'dijitCheckBox';
		},

		_isSingle: function(){
			var select = this.grid.select.row;
			return select.hasOwnProperty('multiple') && !select.arg('multiple');
		},

		_onClear: function(){
			var cls = this._getDijitClass() + 'Checked';
			query('.' + cls, this.grid.bodyNode).removeClass(cls);
		},

		_onHighlightChange: function(target, toHighlight){
			var row =  query('[visualindex="' + target.row + '"].gridxRow', this.grid.bodyNode)[0],
				node = row? query('.gridxIndirectSelectionCheckBox', row)[0] : undefined;
			if(node){
				var dijitClass = this._getDijitClass(),
					partial = toHighlight == 'mixed',
					selected = toHighlight && !partial,
					rowId = row.getAttribute('rowid');
					isUnselectable = !this.grid.row(rowId).isSelectable();
					
				domClass.toggle(node, dijitClass + 'Checked', selected);
				domClass.toggle(node, dijitClass + 'Partial', partial);
				domClass.toggle(node, dijitClass + 'CheckedDisabled', selected && isUnselectable);
				domClass.toggle(node, dijitClass + 'PartialDisabled', partial && isUnselectable);
				domClass.toggle(node, dijitClass + 'Disabled', !selected && !partial && isUnselectable);
				node.setAttribute('aria-checked', selected ? 'true' : partial ? 'mixed' : 'false');
				node.firstChild.innerHTML = selected ? '&#10003;' : partial ? '&#9646;' : '&#9744;';
			}			
		},

		_onMouseOver: function(e){
			var sr = this.grid.select.row;
			if(sr.arg('triggerOnCell') || e.columnId == indirectSelectColumnId){
				if(!sr.triggerOnCell){
					this._triggerOnCell = false;
					sr.triggerOnCell = true;
				}
				if(!sr.arg('holdingCtrl')){
					this._holdingCtrl = false;
					sr.holdingCtrl = true;
				}
			}else{
				this._onMouseOut();
			}
		},

		_onMouseOut: function(){
			var sr = this.grid.select.row;
			if(this.hasOwnProperty('_triggerOnCell')){
				sr.triggerOnCell = false;
				delete this._triggerOnCell;
			}
			if(this.hasOwnProperty('_holdingCtrl')){
				sr.holdingCtrl = false;
				delete this._holdingCtrl;
			}
		},

		_onSelectAll: function(){
			var t = this,
				g = t.grid;
			g.select.row[t._allSelected[t._getPageId()] ? 
				'deselectByIndex' :
				'selectByIndex'
			]([0, g.view.visualCount - 1]);
		},

		_onSelectionChange: function(selected){
			var t = this, d,
				g = t.grid,
				allSelected,
				view = g.view,
				model = t.model,
				start = view.rootStart,
				count = view.rootCount;
			var selectedRoot = array.filter(selected || g.select.row.getSelected(), function(id){
				return !model.treePath(id).pop();
			});
			var unselectableRows = g.select.row._getUnselectableRows();
			var unselectableRoots = array.filter(unselectableRows, function(id){
				return !model.parentId(id) && !g.select.row.isSelected(id);
			});			
			if(count === model.size()){
				allSelected = count && count - unselectableRoots.length == selectedRoot.length;
			}else{
				d = new Deferred();
				model.when({
					start: start,
					count: count
				}, function(){
					var indexes = array.filter(array.map(selectedRoot, function(id){
						return model.idToIndex(id);
					}), function(index){
						return index >= start && index < start + count;
					});
					unselectableRoots = array.filter(unselectableRoots, function(id){
						var index = model.idToIndex(id);
						return index >= start && index < start + count;
					});
					allSelected = count - unselectableRoots.length == indexes.length;
					d.callback();
				});
			}
			Deferred.when(d, function(){
				if(t.arg('all')){
					t._allSelected[t._getPageId()] = allSelected;
					var newHeader = t._createSelectAllBox();
					g._columnsById[indirectSelectColumnId].name = newHeader;
					g.header.getHeaderNode(indirectSelectColumnId).innerHTML = newHeader;
				}
			});
		}
	});
});
