define([
/*====="../../core/Row", =====*/
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/query",
	"dojo/_base/lang",
	"dojo/_base/Deferred",
	"dojo/_base/sniff",
	"dojo/dom-class",
	"dojo/mouse",
	"dojo/keys",
	"../../core/_Module",
	"./_RowCellBase"
], function(/*=====Row, =====*/declare, array, query, lang, Deferred, sniff, domClass, mouse, keys, _Module, _RowCellBase){

/*=====
	Row.select = function(){
		// summary:
		//		Select this row.
	};
	Row.deselect = function(){
		// summary:
		//		Deselect this row.
	};
	Row.isSelected = function(){
		// summary:
		//		Check whether this row is selected.
	};

	return declare(_RowCellBase, {
		// summary:
		//		Provides advanced row selections.
		// description:
		//		This module provides an advanced way for selecting rows by clicking, swiping, SPACE key, or CTRL/SHIFT CLICK to select multiple rows.
		//		This module uses gridx/core/model/extensions/Mark.
		//
		// example:
		//		1. Use select api on grid row object obtained from grid.row(i)
		//		|	grid.row(1).select();
		//		|	grid.row(1).deselect();
		//		|	grid.row(1).isSelected();
		//
		//		2. Use select api on select.row module
		//		|	grid.select.row.selectById(rowId);
		//		|	grid.select.row.deSelectById(rowId);
		//		|	grid.select.row.isSelected(rowId);
		//		|	grid.select.row.getSelected();//[]
		//		|	grid.select.row.clear();

		// triggerOnCell: Boolean
		//		Whether row will be selected by clicking on cell, false by default
		triggerOnCell: false,

		// treeMode: Boolean
		//		Whether to apply tri-state selection for child rows.
		treeMode: true,

		selectById: function(rowId){
			// summary:
			//		Select rows by id.
			// rowId: String...
			//		Row IDs
		},

		deselectById: function(rowId){
			// summary:
			//		Deselect rows by id.
			// rowId: String...
			//		Row ID
		},

		selectByIndex: function(rowIndex){
			// summary:
			//		Select a row by index
			//		This function can also select multiple rows.
			//	|	//Select several individual rows:
			//	|	gridx.select.row.selectByIndex(rowIndex1, rowIndex2, rowIndex3, ...);
			//	|	//Select a range of rows:
			//	|	gridx.select.row.selectByIndex([rowStartIndex, rowEndIndex]);
			//	|	//Select multiple ranges of rows:
			//	|	gridx.select.row.selectByIndex([rowStartIndex1, rowEndIndex1], [rowStartIndex2, rowEndIndex2], ...);
			// rowIndex: Integer...
			//		Row visual indexes
		},

		deSelectByIndex: function(rowIndex){
			// summary:
			//		Deselect a row by index.
			//		This function can also deselect multiple rows. Please refer to selectByIndex().
			// rowIndex: Integer...
			//		Row visual indexes
		},

		getSelected: function(){
			// summary:
			//		Get id array of all selected row IDs.
		},

		isSelected: function(rowId){
			// summary:
			//		Check if the given rows are all selected.
			// rowId: String...
			//		Row IDs
			// returns:
			//		True if all given columns are selected; false if not.
		},

		clear: function(){
			// summary:
			//		Deselected all selected rows;
		},

		onHighlightChange: function(){
			// summary:
			//		Fired when row highlight is changed.
			// tags:
			//		private
		}
	});
=====*/

	return declare(_RowCellBase, {
		name: 'selectRow',

		rowMixin: {
			select: function(){
				this.grid.select.row.selectById(this.id);
				return this;
			},

			deselect: function(){
				this.grid.select.row.deselectById(this.id);
				return this;
			},

			isSelected: function(){
				return this.model.getMark(this.id) === true;
			}
		},
		
		//Public-----------------------------------------------------------------
		triggerOnCell: false,

		treeMode: true,

		getSelected: function(){
			return this.model.getMarkedIds();
		},

		isSelected: function(){
			return array.every(arguments, function(id){
				return this.model.getMark(id) === true;
			}, this);
		},

		clear: function(silent){
			query(".gridxRowSelected", this.grid.mainNode).forEach(function(node){
				domClass.remove(node, 'gridxRowSelected');
				node.removeAttribute('aria-selected');
			});
			query(".gridxRowPartialSelected", this.grid.mainNode).forEach(function(node){
				domClass.remove(node, 'gridxRowPartialSelected');
			});
			this._clear();
			this.model.clearMark();
			if(!silent){
				this._onSelectionChange();
			}
		},

		onHighlightChange: function(){},
		
		//Private---------------------------------------------------------------------
		_type: 'row',

		_init: function(){
			var t = this,
				g = t.grid;
			t.model.treeMarkMode('', t.arg('treeMode'));
			t.inherited(arguments);
			//Use special types to make filtered out rows unselected
			t.model._spTypes.select = 1;	//1 as true
			t.batchConnect(
				g.rowHeader && [g.rowHeader, 'onMoveToRowHeaderCell', '_onMoveToRowHeaderCell'],
				[g, 'onRowMouseDown', function(e){
					if(mouse.isLeft(e) && ((t.arg('triggerOnCell') &&
						!domClass.contains(e.target, 'gridxTreeExpandoIcon') &&
						!domClass.contains(e.target, 'gridxTreeExpandoInner')) || !e.columnId)){
						t._isOnCell = e.columnId;
						if(t._isOnCell){
							g.body._focusCellCol = e.columnIndex;
						}
						t._start({row: e.visualIndex}, g._isCopyEvent(e), e.shiftKey);
					}
				}],
				[g, 'onRowMouseOver', function(e){
					if(t._selecting && t.arg('triggerOnCell') && e.columnId){
						g.body._focusCellCol = e.columnIndex;
					}
					t._highlight({row: e.visualIndex});
				}],
				[g, sniff('ff') < 4 ? 'onRowKeyUp' : 'onRowKeyDown', function(e){
					if(e.keyCode == keys.SPACE && (!e.columnId ||
							(g._columnsById[e.columnId].rowSelectable) ||
							//When trigger on cell, check if we are navigating on body, reducing the odds of conflictions.
							(t.arg('triggerOnCell') && (!g.focus || g.focus.currentArea() == 'body')))){
						t._isOnCell = e.columnId;
						t._start({row: e.visualIndex}, g._isCopyEvent(e), e.shiftKey);
						t._end();
					}
				}]);
		},

		_markById: function(args, toSelect){
			var m = this.model;
			array.forEach(args, function(arg){
				m.markById(arg, toSelect);
			});
			m.when();
		},

		_markByIndex: function(args, toSelect){
			var g = this.grid,
				m = this.model,
				view = g.view,
				rowInfo;
			array.forEach(args, function(arg){
				if(lang.isArrayLike(arg)){
					var start = arg[0],
						end = arg[1],
						i, count;
					if(start >= 0 && start < Infinity){
						if(end >= start && end < Infinity){
							count = end - start + 1;
						}else{
							count = view.visualCount - start;
						}
						rowInfo = view.getRowInfo({visualIndex: start});
						start = rowInfo.rowIndex;
						for(i = 0; i < count; ++i){
							m.markByIndex(i + start, toSelect, '', rowInfo.parentId);
						}
					}
				}else if(arg >= 0 && arg < Infinity){
					rowInfo = view.getRowInfo({visualIndex: arg});
					m.markByIndex(rowInfo.rowIndex, toSelect, '', rowInfo.parentId);
				}
			});
			return m.when();
		},

		_onRender: function(start, count){
			var t = this, i, end = start + count;
			for(i = start; i < end; ++i){
				var item = {row: i},
					toHighlight = t._isSelected(item) || (t._selecting && t._toSelect &&
						t._inRange(i, t._startItem.row, t._currentItem.row, 1));
				if(toHighlight){
					t._doHighlight(item, toHighlight);
				}
			}
		},

		_onMark: function(id, toMark, oldState, type){
			if(type == 'select'){
				var nodes = query('[rowid="' + id + '"]', this.grid.mainNode);
				if(nodes.length){
					nodes.forEach(function(node){
						var selected = toMark && toMark != 'mixed';
						domClass.toggle(node, 'gridxRowSelected', selected);
						domClass.toggle(node, 'gridxRowPartialSelected', toMark == 'mixed');
						node.setAttribute('aria-selected', !!selected);
					});
					this.onHighlightChange({row: parseInt(nodes[0].getAttribute('visualindex'), 10)}, toMark);
				}
			}
		},

		_onMoveToCell: function(rowVisIndex, colIndex, e){
			var t = this;
			if(t.arg('triggerOnCell') && e.shiftKey && (e.keyCode == keys.UP_ARROW || e.keyCode == keys.DOWN_ARROW)){
				t._start({row: rowVisIndex}, t.grid._isCopyEvent(e), 1);	//1 as true
				t._end();
			}
		},

		_onMoveToRowHeaderCell: function(rowVisIndex, e){
			if(e.shiftKey){
				this._start({row: rowVisIndex}, this.grid._isCopyEvent(e), 1);	//1 as true
				this._end();
			}
		},

		_isSelected: function(target){
			var t = this,
				id = t._getRowId(target.row);
			return t._isRange ? array.indexOf(t._refSelectedIds, id) >= 0 : t.model.getMark(id);
		},

		_beginAutoScroll: function(){
			var autoScroll = this.grid.autoScroll;
			this._autoScrollH = autoScroll.horizontal;
			autoScroll.horizontal = false;
		},

		_endAutoScroll: function(){
			this.grid.autoScroll.horizontal = this._autoScrollH;
		},

		_doHighlight: function(target, toHighlight){
			query('[visualindex="' + target.row + '"]', this.grid.mainNode).forEach(function(node){
				var selected = toHighlight && toHighlight != 'mixed';
				domClass.toggle(node, 'gridxRowSelected', selected);
				domClass.toggle(node, 'gridxRowPartialSelected', toHighlight == 'mixed');
				node.setAttribute('aria-selected', !!selected);
			});
			this.onHighlightChange(target, toHighlight);
		},

		_end: function(){
			this.inherited(arguments);
			delete this._isOnCell;
		},

		_focus: function(target){
			var g = this.grid, focus = g.focus;
			if(focus){
				g.body._focusCellRow = target.row;
				focus.focusArea(this._isOnCell ? 'body' : 'rowHeader', true);
			}
		},

		_addToSelected: function(start, end, toSelect){
			var t = this,
				view = t.grid.view,
				m = t.model,
				lastEndItem = t._lastEndItem,
				a, b, i, d;
			if(!t._isRange){
				t._refSelectedIds = m.getMarkedIds();
			}
			if(t._isRange && t._inRange(end.row, start.row, lastEndItem.row)){
				a = Math.min(end.row, lastEndItem.row);
				b = Math.max(end.row, lastEndItem.row);
				start = view.getRowInfo({visualIndex: a}).rowIndex + 1;
				end = view.getRowInfo({visualIndex: b}).rowIndex;
				d = new Deferred();
				m.when({
					start: start, 
					count: end - start + 1
				}, function(){
					for(i = start; i <= end; ++i){
						var id = m.indexToId(i),
							selected = array.indexOf(t._refSelectedIds, id) >= 0;
						m.markById(id, selected); 
					}
				}).then(function(){
					m.when(null, function(){
						d.callback();
					});
				});
				return d;
			}else{
				a = Math.min(start.row, end.row);
				b = Math.max(start.row, end.row);

				for(i = a; i <= b; ++i){
					var rowInfo = view.getRowInfo({visualIndex: i});
					m.markByIndex(rowInfo.rowIndex, toSelect, '', rowInfo.parentId);
				}
				return m.when();
			}
		}
	});
});