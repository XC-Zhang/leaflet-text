(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['leaflet'], factory);
    } else if (typeof modules === 'object' && module.exports) {
        // define a Common JS module that relies on 'leaflet'
        module.exports = factory(require('leaflet'));
    } else {
        // Assume Leaflet is loaded into global object L already
        factory(L);
    }
}(this, function (L) {
    'use strict';

    L.Canvas.include({
        _getTextWidth: function (layer) {
            return this._ctx.measureText(layer._text).width;
        },

        _updateText: function (layer) {
            if (!this._drawing || layer._empty()) {
                return;
            }

            var p = layer._point,
                ctx = this._ctx,
                options = layer.options;
            
            if (!options.fill) {
                return;
            }

            this._drawnLayers[layer._leaflet_id] = layer;

            ctx.translate(p.x, p.y);
            ctx.rotate(options.rotation);
            ctx.fillStyle = options.color;
            ctx.textAlign = options.textAlign;
            ctx.fillText(layer._text, 0, 0);
            ctx.rotate(-options.rotation);
            ctx.translate(-p.x, -p.y);
        }
    });

    L.SVG.include({
        _getTextWidth: function (layer) {
            return layer._path.getComputedTextLength();
        },

        _initPath: function (layer) {
            var path;

            if (L.Text && layer instanceof L.Text) {
                path = layer._path = L.SVG.create("text");
                path.textContent = layer._text;
            } else {
                path = layer._path = L.SVG.create("path");
            }

            if (layer.options.className) {
                L.DomUtil.addClass(path, layer.options.className);
            }

            if (layer.options.interactive) {
                L.DomUtil.addClass(path, 'leaflet-interactive');
            }

            this._updateStyle(layer);
            this._layers[L.stamp(layer)] = layer;
        },

        _updateText: function (layer) {
            var path = layer._path,
                p = layer._point,
                options = layer.options;
            
            path.setAttribute('x', p.x);
            path.setAttribute('y', p.y);
            path.setAttribute('transform', 'rotate(' + options.rotation / Math.PI * 180 + ' ' + p.x + ' ' + p.y + ')');
            path.setAttribute('text-anchor', options.textAlign === 'center' ? 'middle' : options.textAlign);
        }
    });

    L.Text = L.Path.extend({
        options: {
            color: 'black',
            fill: true,
            fillOpacity: 1.0,
            rotation: 0.0,
            stroke: false,
            textAlign: 'center'
        },

        initialize: function (latlng, text, options) {
            if (typeof text !== 'string') {
                throw new TypeError('Parameter {text} must be a string.');
            }
            L.Util.setOptions(this, options);
            this._latlng = L.latLng(latlng);
            this._text = text;
        },

        getLatLng: function () {
            return this._latlng;
        },

        _project: function () {
            this._point = this._map.latLngToLayerPoint(this._latlng);
            this._updateBounds();
        },

        _updateBounds: function () {
            var w = this._renderer._getTextWidth(this);
            var p = [w / 2, w / 2];
            this._pxBounds = L.bounds(this._point.subtract(p), this._point.add(p));
        },

        _update: function () {
            if (this._map) {
                this._updatePath();
            }
        },

        _updatePath: function () {
            this._renderer._updateText(this);
        },

        _empty: function () {
            return !this._renderer._bounds.intersects(this._pxBounds);
        },

        _containsPoint: function (p) {
            return false;
        }
    });

    L.text = function (latlng, text, options) {
        return new L.Text(latlng, text, options);
    };

    return L;
}));