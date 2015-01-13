// Generated by CoffeeScript 1.8.0
(function() {
  var ChromePicturesNewTab;

  ChromePicturesNewTab = (function() {
    var BookmarkItem, BookmarksBar, BookmarksList, BookmarksPopup;

    ChromePicturesNewTab.prototype.fetchSize = 500;

    ChromePicturesNewTab.prototype.attrRegexp = new RegExp("^[^-]+-photo-(.+)");

    function ChromePicturesNewTab($viewport) {
      this.$viewport = $viewport;
      this.$photo = $("#photo");
      this.$photoFooter = $("#photo-footer");
      this.$photoTitleLink = $("#photo-title-link");
      this.$photoTitleOwnerLink = $("#photo-title-owner-link");
      this.$photoRefreshLink = $("#photo-refresh-link");
      this.$photoPinLink = $("#photo-pin-link");
      this.viewportWidth = this.$viewport.width();
      this.viewportHeight = this.$viewport.height();
      window.addEventListener("resize", (function(_this) {
        return function() {
          _this.viewportWidth = _this.$viewport.width();
          return _this.viewportHeight = _this.$viewport.height();
        };
      })(this), false);
      this.ensureCachedPhoto("current").then((function(_this) {
        return function(photo) {
          var timedOut;
          timedOut = ((new Date()).getTime() - (parseInt(photo.timestamp, 10) || Infinity)) > 900000;
          if (timedOut && !photo.isPinned) {
            return _this.advancePhoto();
          } else {
            _this.displayPhoto(photo);
            return _this.ensureCachedPhoto("next");
          }
        };
      })(this));
      this.bookmarksBar = new BookmarksBar();
      this.bookmarksBar.render(this.$viewport[0]);
      this.$photoRefreshLink.on("click", (function(_this) {
        return function() {
          return _this.refreshPhoto();
        };
      })(this));
      this.$photoPinLink.on("click", (function(_this) {
        return function() {
          var data;
          data = {};
          data["current-photo-isPinned"] = true;
          return chrome.storage.local.set(data, function() {
            return _this.$photoPinLink.text("Pinned");
          });
        };
      })(this));
      document.body.addEventListener("click", (function(_this) {
        return function(event) {
          if (!$(event.target).closest(".bookmarks-popup").length) {
            return _this.bookmarksBar.hidePopupIfPresent();
          }
        };
      })(this), false);
      window.addEventListener("resize", (function(_this) {
        return function() {
          return _this.bookmarksBar.hidePopupIfPresent();
        };
      })(this), false);
    }

    ChromePicturesNewTab.prototype.displayPhoto = function(photo) {
      console.log("Displaying photo", photo);
      chrome.storage.local.get(["current-photo-timestamp"], function(data) {
        if (!data["current-photo-timestamp"]) {
          data["current-photo-timestamp"] = (new Date()).getTime();
          return chrome.storage.local.set(data);
        }
      });
      this.$photo.css("background-image", "url(" + photo.dataUri + ")");
      this.$photoTitleLink.text(photo.title);
      this.$photoTitleLink.attr("href", photo.webUrl);
      this.$photoTitleOwnerLink.html("&copy; " + photo.ownerName);
      this.$photoTitleOwnerLink.attr("href", photo.ownerWebUrl);
      if ((photo.bottomGrayscale / 255.0) * 100 < 50) {
        this.$photoFooter.attr("data-color", "dark");
      } else {
        this.$photoFooter.attr("data-color", "light");
      }
      if ((photo.topGrayscale / 255.0) * 100 < 50) {
        $(this.bookmarksBar.$el).attr("data-color", "dark");
      } else {
        $(this.bookmarksBar.$el).attr("data-color", "light");
      }
      if (photo.isPinned) {
        this.$photoPinLink.text("Pinned");
      } else {
        this.$photoPinLink.text("Pin");
      }
      return null;
    };

    ChromePicturesNewTab.prototype.advancePhoto = function() {
      return this.ensureCachedPhoto("next").then((function(_this) {
        return function(photo) {
          return _this.savePhoto(photo, "current").then(function() {
            _this.displayPhoto(photo);
            return _this.deleteCachedPhoto("next").then(function() {
              return _this.ensureCachedPhoto("next");
            });
          });
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.refreshPhoto = function() {
      return this.fetchPhoto().then((function(_this) {
        return function(photo) {
          return _this.savePhoto(photo, "next").then(function() {
            return _this.advancePhoto();
          });
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.ensureCachedPhoto = function(prefix) {
      return this.cachedPhoto(prefix).then(null, (function(_this) {
        return function() {
          return _this.fetchPhoto().then(function(photo) {
            _this.savePhoto(photo, prefix);
            return photo;
          });
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.cachedPhoto = function(prefix) {
      return new RSVP.Promise((function(_this) {
        return function(resolve, reject) {
          var err;
          try {
            return chrome.storage.local.get(["" + prefix + "-photo-dataUri", "" + prefix + "-photo-topGrayscale", "" + prefix + "-photo-bottomGrayscale", "" + prefix + "-photo-url", "" + prefix + "-photo-contentType", "" + prefix + "-photo-title", "" + prefix + "-photo-webUrl", "" + prefix + "-photo-ownerName", "" + prefix + "-photo-ownerWebUrl", "" + prefix + "-photo-timestamp", "" + prefix + "-photo-isPinned"], function(data) {
              var photo, _ref;
              photo = _this.decodePhoto(data);
              if (((_ref = photo.dataUri) != null ? _ref.length : void 0) > 0) {
                console.log("Photo cache hit: " + prefix);
                return resolve(photo);
              } else {
                console.warn("Photo cache miss: " + prefix);
                return reject();
              }
            });
          } catch (_error) {
            err = _error;
            console.error("Photo cache error: " + prefix, err);
            return reject(err);
          }
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.savePhoto = function(photo, prefix) {
      return new RSVP.Promise((function(_this) {
        return function(resolve, reject) {
          var data, err;
          try {
            data = _this.encodePhoto(photo, prefix);
            return chrome.storage.local.set(data, function() {
              console.log("Photo saved with prefix: " + prefix);
              return resolve();
            });
          } catch (_error) {
            err = _error;
            console.error("Error saving photo", err);
            return reject(err);
          }
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.deleteCachedPhoto = function(prefix) {
      return new RSVP.Promise((function(_this) {
        return function(resolve, reject) {
          var err;
          try {
            return chrome.storage.local.remove(["" + prefix + "-photo-dataUri", "" + prefix + "-photo-topGrayscale", "" + prefix + "-photo-bottomGrayscale", "" + prefix + "-photo-url", "" + prefix + "-photo-contentType", "" + prefix + "-photo-title", "" + prefix + "-photo-webUrl", "" + prefix + "-photo-ownerName", "" + prefix + "-photo-ownerWebUrl", "" + prefix + "-photo-timestamp", "" + prefix + "-photo-isPinned"], function() {
              console.log("Photo deleted with prefix: " + prefix);
              return resolve();
            });
          } catch (_error) {
            err = _error;
            console.error("Error deleting photo", err);
            return reject(err);
          }
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.decodePhoto = function(data) {
      var photo;
      photo = {};
      _.each(_.keys(data), (function(_this) {
        return function(key) {
          var attrName;
          attrName = key.match(_this.attrRegexp)[1];
          return photo[attrName] = data[key];
        };
      })(this));
      return photo;
    };

    ChromePicturesNewTab.prototype.encodePhoto = function(photo, prefix) {
      var data;
      data = {};
      _.each(_.keys(photo), (function(_this) {
        return function(attr) {
          return data["" + prefix + "-photo-" + attr] = photo[attr];
        };
      })(this));
      return data;
    };

    ChromePicturesNewTab.prototype.fetchPhoto = function() {
      return new RSVP.Promise((function(_this) {
        return function(resolve, reject) {
          return _this.fetchPhotos().then(function(resp) {
            var index, ownerName, ownerWebUrl, photo, photos, title, webUrl;
            photos = $(resp).find("photo").toArray();
            index = parseInt(Math.random() * photos.length * 10, 10) % photos.length;
            photo = photos[index];
            title = photo.getAttribute("title");
            webUrl = _this.photoWebUrl(photo.getAttribute("owner"), photo.getAttribute("id"));
            ownerName = photo.getAttribute("ownername");
            ownerWebUrl = _this.ownerWebUrl(photo.getAttribute("owner"));
            console.log("Use photo at index " + index + " of " + photos.length + " photos", photo);
            console.log(" * title: " + title);
            console.log(" * webUrl: " + webUrl);
            console.log(" * ownerName: " + ownerName);
            return _this.fetchPhotoSizes(photo.getAttribute("id")).then(function(resp) {
              var contentType, largestSize, url;
              largestSize = _.reduce($(resp).find("size").toArray(), function(largest, size) {
                var largestArea, largestHeight, largestWidth, sizeArea, sizeHeight, sizeWidth;
                if (!largest) {
                  largest = size;
                }
                largestWidth = largest.getAttribute("width");
                largestHeight = largest.getAttribute("height");
                sizeWidth = size.getAttribute("width");
                sizeHeight = size.getAttribute("height");
                if (sizeWidth <= _this.viewportWidth || sizeHeight <= _this.viewportHeight) {
                  largestArea = largestWidth * largestHeight;
                  sizeArea = sizeWidth * sizeHeight;
                  if (sizeArea > largestArea) {
                    largest = size;
                  }
                }
                return largest;
              }, null);
              url = largestSize.getAttribute("source");
              contentType = "image/" + (url.match(/\.([^.]+)$/)[1]);
              photo.setAttribute("url", url);
              photo.setAttribute("content-type", contentType);
              return _this.urlToImageData(url, contentType).then(function(imageData) {
                return resolve({
                  dataUri: imageData.dataUri,
                  topGrayscale: imageData.topGrayscale,
                  bottomGrayscale: imageData.bottomGrayscale,
                  url: url,
                  contentType: contentType,
                  title: title,
                  webUrl: webUrl,
                  ownerName: ownerName,
                  ownerWebUrl: ownerWebUrl,
                  isPinned: false
                });
              });
            });
          })["catch"](function() {
            console.error("Error fetching photo", arguments);
            return reject.apply(null, arguments);
          });
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.fetchPhotos = function() {
      return this.flickrApiRequest("flickr.interestingness.getList", {
        per_page: this.fetchSize,
        page: 1,
        extras: "license,owner_name"
      });
    };

    ChromePicturesNewTab.prototype.fetchPhotoSizes = function(id) {
      return this.flickrApiRequest("flickr.photos.getSizes", {
        photo_id: id
      });
    };

    ChromePicturesNewTab.prototype.flickrApiRequest = function(method, params) {
      return new RSVP.Promise(function(resolve, reject) {
        return $.ajax({
          type: "GET",
          url: "https://api.flickr.com/services/rest",
          data: _.extend({
            method: method,
            api_key: "7d05080a526b965ba4978c0656dfdaf3"
          }, params)
        }).done(function(resp, status, req) {
          return resolve(resp, status, req);
        }).fail(function(req, status, message) {
          return reject(req, status, message);
        });
      });
    };

    ChromePicturesNewTab.prototype.photoWebUrl = function(userId, photoId) {
      return "https://www.flickr.com/photos/" + userId + "/" + photoId;
    };

    ChromePicturesNewTab.prototype.ownerWebUrl = function(userId) {
      return "https://www.flickr.com/photos/" + userId;
    };

    ChromePicturesNewTab.prototype.urlToImageData = function(url, contentType) {
      return new RSVP.Promise((function(_this) {
        return function(resolve) {
          var canvas, ctx, img;
          canvas = document.createElement('CANVAS');
          ctx = canvas.getContext('2d');
          img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = function() {
            var bottomData, topData;
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            topData = ctx.getImageData(0, 0, img.width, 20);
            bottomData = ctx.getImageData(0, img.height - 16, img.width, 16);
            resolve({
              dataUri: canvas.toDataURL(contentType),
              topGrayscale: _this.rgbToGrayscale(_this.averageRgb(topData)),
              bottomGrayscale: _this.rgbToGrayscale(_this.averageRgb(bottomData))
            });
            return $(canvas).remove();
          };
          return img.src = url;
        };
      })(this));
    };

    ChromePicturesNewTab.prototype.averageRgb = function(data) {
      var count, index, rgb;
      count = 0;
      index = 0;
      rgb = {
        r: 0,
        g: 0,
        b: 0
      };
      while (true) {
        if (index >= data.data.length) {
          break;
        }
        rgb.r += data.data[index];
        rgb.g += data.data[index + 1];
        rgb.b += data.data[index + 2];
        index += 5 * 4;
        count += 1;
      }
      rgb.r = Math.floor(rgb.r / count);
      rgb.g = Math.floor(rgb.g / count);
      rgb.b = Math.floor(rgb.b / count);
      return rgb;
    };

    ChromePicturesNewTab.prototype.rgbToGrayscale = function(rgb) {
      console.log(rgb);
      return (0.21 * rgb.r) + (0.72 * rgb.g) + (0.07 * rgb.b);
    };

    BookmarksBar = (function() {
      function BookmarksBar() {
        this.bookmarksLoaded = new RSVP.Promise((function(_this) {
          return function(resolve, reject) {
            return chrome.bookmarks.getChildren("1", function(bookmarks) {
              _this.bookmarks = bookmarks;
              return resolve(_this.bookmarks);
            });
          };
        })(this));
      }

      BookmarksBar.prototype.render = function($viewport) {
        this.$viewport = $viewport;
        this.$el = document.createElement("div");
        this.$el.id = "bookmarks-bar";
        this.$viewport.appendChild(this.$el);
        return this.bookmarksLoaded.then((function(_this) {
          return function() {
            _this.mainBookmarksList = new BookmarksList(_this.bookmarks, {
              delegate: _this
            });
            _this.mainBookmarksList.render(_this.$el);
            _this.otherBookmarksList = new BookmarksList([
              {
                id: "2",
                title: "Other Bookmarks"
              }
            ], {
              delegate: _this
            });
            _this.otherBookmarksList.render(_this.$el);
            return _this.otherBookmarksList.$el.className += " other-bookmarks";
          };
        })(this));
      };

      BookmarksBar.prototype.hidePopupIfPresent = function() {
        this.otherBookmarksList.hidePopupIfPresent();
        return this.mainBookmarksList.hidePopupIfPresent();
      };

      BookmarksBar.prototype.BookmarksListDidOpenFolder = function(bookmarksList) {
        if (bookmarksList === this.mainBookmarksList) {
          return this.otherBookmarksList.hidePopupIfPresent();
        } else {
          return this.mainBookmarksList.hidePopupIfPresent();
        }
      };

      BookmarksBar.prototype.BookmarksListDidMouseOverItem = function(bookmarksList, bookmarkItem) {
        if (bookmarkItem.isFolder()) {
          if (bookmarksList === this.mainBookmarksList) {
            return this.otherBookmarksList.hidePopupIfPresent();
          } else {
            return this.mainBookmarksList.hidePopupIfPresent();
          }
        } else {
          return this.hidePopupIfPresent();
        }
      };

      return BookmarksBar;

    })();

    BookmarksList = (function() {
      function BookmarksList(bookmarks, options) {
        this.bookmarks = bookmarks;
        this.options = options != null ? options : {};
        this.delegate = this.options.delegate;
      }

      BookmarksList.prototype.render = function($viewport) {
        var bookmark, bookmarkItem, _i, _len, _ref;
        this.$viewport = $viewport;
        this.$el = document.createElement("ul");
        this.$el.className = "bookmarks-list clearfix";
        _ref = this.bookmarks;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bookmark = _ref[_i];
          bookmarkItem = new BookmarkItem(bookmark);
          bookmarkItem.delegate = this;
          bookmarkItem.render(this.$el);
        }
        return this.$viewport.appendChild(this.$el);
      };

      BookmarksList.prototype.hidePopupIfPresent = function() {
        if (this.popup) {
          this.popup.hide();
          return this.popup = null;
        }
      };

      BookmarksList.prototype.openFolder = function(bookmarkItem) {
        var _ref;
        chrome.bookmarks.getChildren(bookmarkItem.bookmarkId, (function(_this) {
          return function(bookmarks) {
            _this.hidePopupIfPresent();
            _this.popup = new BookmarksPopup(bookmarks, {
              folderId: bookmarkItem.bookmarkId
            });
            return _this.popup.render(bookmarkItem.$link);
          };
        })(this));
        return (_ref = this.delegate) != null ? typeof _ref.BookmarksListDidOpenFolder === "function" ? _ref.BookmarksListDidOpenFolder(this) : void 0 : void 0;
      };

      BookmarksList.prototype.BookmarkItemDidClick = function(bookmarkItem) {
        if (bookmarkItem.isFolder()) {
          return this.openFolder(bookmarkItem);
        }
      };

      BookmarksList.prototype.BookmarkItemDidMouseOver = function(bookmarkItem) {
        var _ref;
        if (!bookmarkItem.isFolder()) {
          this.hidePopupIfPresent();
        }
        return (_ref = this.delegate) != null ? typeof _ref.BookmarksListDidMouseOverItem === "function" ? _ref.BookmarksListDidMouseOverItem(this, bookmarkItem) : void 0 : void 0;
      };

      BookmarksList.prototype.BookmarkItemWillClick = function(bookmarkItem) {
        return this.hidePopupIfPresent();
      };

      return BookmarksList;

    })();

    BookmarksPopup = (function() {
      function BookmarksPopup(bookmarks, options, flowtipOptions) {
        this.bookmarks = bookmarks;
        this.options = options != null ? options : {};
        this.flowtipOptions = flowtipOptions != null ? flowtipOptions : {};
        this.parentPopup = this.options.parentPopup;
        this.parentRegion = this.options.parentRegion;
        this.folderId = this.options.folderId;
      }

      BookmarksPopup.prototype.render = function($target) {
        var bookmark, bookmarkItem, flowtipOptions, _i, _len, _ref;
        this.$target = $target;
        this.$el = document.createElement("ul");
        this.$el.className = "bookmarks-list";
        _ref = this.bookmarks;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bookmark = _ref[_i];
          bookmarkItem = new BookmarkItem(bookmark);
          bookmarkItem.delegate = this;
          bookmarkItem.render(this.$el);
        }
        flowtipOptions = this.parentPopup ? {
          region: this.parentRegion || "right",
          topDisabled: true,
          leftDisabled: false,
          rightDisabled: false,
          bottomDisabled: true,
          rootAlign: "edge",
          leftRootAlignOffset: 0,
          rightRootAlignOffset: -0.1,
          targetAlign: "edge",
          leftTargetAlignOffset: 0,
          rightTargetAlignOffset: -0.1
        } : {
          region: "bottom",
          topDisabled: true,
          leftDisabled: true,
          rightDisabled: true,
          bottomDisabled: false,
          rootAlign: "edge",
          rootAlignOffset: 0,
          targetAlign: "edge",
          targetAlignOffset: 0
        };
        this.flowtip = new FlowTip(_.extend({
          className: "bookmarks-popup",
          hasTail: false,
          rotationOffset: 0,
          edgeOffset: 10,
          targetOffset: 2,
          maxHeight: "" + (this.maxHeight()) + "px"
        }, flowtipOptions, this.flowtipOptions));
        this.flowtip.setTooltipContent(this.$el);
        this.flowtip.setTarget(this.$target);
        this.flowtip.show();
        return this.flowtip.content.addEventListener("scroll", (function(_this) {
          return function() {
            return _this.hidePopupIfPresent();
          };
        })(this), false);
      };

      BookmarksPopup.prototype.hide = function() {
        this.hidePopupIfPresent();
        this.flowtip.hide();
        return this.flowtip.destroy();
      };

      BookmarksPopup.prototype.hidePopupIfPresent = function() {
        if (this.popup) {
          this.popup.hide();
          return this.popup = null;
        }
      };

      BookmarksPopup.prototype.openFolder = function(bookmarkItem) {
        return chrome.bookmarks.getChildren(bookmarkItem.bookmarkId, (function(_this) {
          return function(bookmarks) {
            _this.hidePopupIfPresent();
            _this.popup = new BookmarksPopup(bookmarks, {
              parentPopup: _this,
              parentRegion: _this.parentPopup ? _this.flowtip._region : void 0,
              folderId: bookmarkItem.bookmarkId
            });
            return _this.popup.render(bookmarkItem.$link);
          };
        })(this));
      };

      BookmarksPopup.prototype.maxHeight = function() {
        if (this.parentPopup) {
          return document.body.clientHeight - 20;
        } else {
          return document.body.clientHeight - 41;
        }
      };

      BookmarksPopup.prototype.BookmarkItemDidMouseOver = function(bookmarkItem) {
        var _ref;
        if (bookmarkItem.isFolder()) {
          if (this.popup) {
            if (this.popup.folderId !== bookmarkItem.bookmarkId) {
              this.hidePopupIfPresent();
            }
          } else {
            this.openFolder(bookmarkItem);
          }
        } else {
          this.hidePopupIfPresent();
        }
        return (_ref = this.parentPopup) != null ? typeof _ref.BookmarksPopupDidMouseOverItem === "function" ? _ref.BookmarksPopupDidMouseOverItem(bookmarkItem) : void 0 : void 0;
      };

      BookmarksPopup.prototype.BookmarkItemDidMouseOut = function(bookmarkItem) {
        if (bookmarkItem.isFolder()) {
          if (!this.mouseoutTimeout) {
            return this.mouseoutTimeout = _.delay((function(_this) {
              return function() {
                _this.hidePopupIfPresent();
                return _this.mouseoutTimeout = null;
              };
            })(this), 100);
          }
        }
      };

      BookmarksPopup.prototype.BookmarkItemWillClick = function(bookmarkItem) {
        if (this.popup && this.popup.folderId !== bookmarkItem.bookmarkId) {
          return this.hidePopupIfPresent();
        }
      };

      BookmarksPopup.prototype.BookmarkItemDidClick = function(bookmarkItem) {
        var _ref;
        return (_ref = this.parentPopup) != null ? typeof _ref.BookmarksPopupDidClickItem === "function" ? _ref.BookmarksPopupDidClickItem(bookmarkItem) : void 0 : void 0;
      };

      BookmarksPopup.prototype.BookmarksPopupDidMouseOverItem = function(bookmarkItem) {
        if (this.mouseoutTimeout) {
          clearTimeout(this.mouseoutTimeout);
          return this.mouseoutTimeout = null;
        }
      };

      BookmarksPopup.prototype.BookmarksPopupDidClickItem = function(bookmarkItem) {
        if (this.parentPopup) {
          return this.hidePopupIfPresent();
        } else {
          return this.hide();
        }
      };

      return BookmarksPopup;

    })();

    BookmarkItem = (function() {
      function BookmarkItem(bookmark) {
        this.bookmark = bookmark;
        this.bookmarkId = this.bookmark.id;
      }

      BookmarkItem.prototype.render = function($viewport) {
        var $label, $link;
        this.$viewport = $viewport;
        this.$el = document.createElement("li");
        this.$el.className = "bookmark-item";
        if (!this.bookmark.url) {
          this.$el.className += " folder-item";
        }
        $link = document.createElement("a");
        $label = document.createElement("span");
        $link.className = "clearfix";
        if (!this.isFolder()) {
          $link.setAttribute("href", this.bookmark.url);
        }
        $link.addEventListener("mouseover", (function(_this) {
          return function() {
            if (_this.mouseoutTimeout) {
              clearTimeout(_this.mouseoutTimeout);
              return _this.mouseoutTimeout = null;
            } else {
              return _.delay(function() {
                var _ref;
                return (_ref = _this.delegate) != null ? typeof _ref.BookmarkItemDidMouseOver === "function" ? _ref.BookmarkItemDidMouseOver(_this) : void 0 : void 0;
              }, 110);
            }
          };
        })(this), false);
        $link.addEventListener("mouseout", (function(_this) {
          return function() {
            if (!_this.mouseoutTimeout) {
              return _this.mouseoutTimeout = _.delay(function() {
                var _ref;
                if ((_ref = _this.delegate) != null) {
                  if (typeof _ref.BookmarkItemDidMouseOut === "function") {
                    _ref.BookmarkItemDidMouseOut(_this);
                  }
                }
                return _this.mouseoutTimeout = null;
              }, 100);
            }
          };
        })(this), false);
        $link.addEventListener("mousedown", (function(_this) {
          return function() {
            var _ref;
            return (_ref = _this.delegate) != null ? typeof _ref.BookmarkItemWillClick === "function" ? _ref.BookmarkItemWillClick(_this) : void 0 : void 0;
          };
        })(this), false);
        $link.addEventListener("click", (function(_this) {
          return function() {
            var _ref;
            return (_ref = _this.delegate) != null ? typeof _ref.BookmarkItemDidClick === "function" ? _ref.BookmarkItemDidClick(_this) : void 0 : void 0;
          };
        })(this), false);
        $label.innerHTML = this.bookmark.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (this.isFolder()) {
          $label.innerHTML += " &raquo;";
        }
        $link.appendChild($label);
        this.$el.appendChild($link);
        this.$link = $link;
        return this.$viewport.appendChild(this.$el);
      };

      BookmarkItem.prototype.isFolder = function() {
        return !this.bookmark.url;
      };

      return BookmarkItem;

    })();

    return ChromePicturesNewTab;

  })();

  window.onload = function() {
    var classicNewTab;
    return classicNewTab = new ChromePicturesNewTab($(document.body));
  };

}).call(this);
