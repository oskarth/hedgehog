(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [clojure.walk :as walk]
            [goog.dom :as gdom]
            [crate.core :as crate]))

(def document js/document)
(def window js/window)
(defn body-el [] (.-body document))

(def ^:dynamic !event-map (atom {}))

(def dom-state (atom
  {:focus nil
   :selection nil}))

(def rerender? (atom true))

(defn toggle-rerender []
  (reset! rerender? (not @rerender?)))

;; event binding and traversing
;;--------------------------------------------------------------------


;; dom helpers
;;--------------------------------------------------------------------

(defn dom-ready! [f]
  (set! (.-onload window) f))
   
(defn- get-element-index
  "gets index of element in relation to its siblings"
  [el]
  (let [siblings (js->clj (js/Array.prototype.slice.call
                           (-> el .-parentNode .-childNodes)))]
    (count (take-while (partial not= el) siblings))))
                    
(defn- get-element-path
  "get xpath of a dom element"
  [el]
  (let [parent (.-parentNode el)
        tagname (.-tagName el)]
  (cond
   (not= (.-id el) "") (str "id(\"" (.-id el) "\")")
   (= el (body-el)) tagname
   :else
     (str (get-element-path parent)
          "/" tagname
          "[" (get-element-index el) "]"))))

(defn- get-element
  ""
  [xpath]
  (.iterateNext
    (.evaluate document xpath document nil js/XPathResult.ANY_TYPE nil)))

(defn- get-selection
  "returns [start end dir] vector representing element selection"
  [el]
  [(.-selectionStart el) (.-selectionEnd el) (.-selectionDirection el)])

(defn- set-selection!
  "restores selection using vector from get-selection"
  [el selection]
  (let [[start end dir] selection]
    (.setSelectionRange el start end dir)))

;; event handlers
;;--------------------------------------------------------------------

; (defn handle-input
;   [ev]
;   (let [target (.-target ev)
;         id (.getAttribute target "id")
;         obs ((keyword id) render-map)
;         val (.-value target)]
;     (when obs (reset! obs val))))


;; render
;;--------------------------------------------------------------------

(defn- restore-focus!
  ""
  [{:keys [focus selection] :as curr-dom-state}]
  (when-let [focus-el (get-element focus)]
    (.focus focus-el)
    (when selection
      (set-selection! focus-el selection))))

(defn- set-title! [title]
  (set! (.-title document) @title))

(defn- pre-render!
  ""
  []
  (let [active-el (.-activeElement document)]
    (swap! dom-state assoc
           :focus (get-element-path active-el)
           :selection (get-selection active-el))))

(defn- update-dom!
  ""
  [body]
  (when @rerender?
    (gdom/removeChildren (body-el)))
  (dom/insert-at (body-el)
   (crate/html @body) 0))

(defn- post-render!
  ""
  []
  (let [curr-dom-state @dom-state]
    (restore-focus! curr-dom-state)))

(defn- render!
  ""
  [title body]
  (pre-render!)
  (set-title! title)
  (update-dom! body)
  (post-render!))

(defn- make-watcher!
  "creates a watcher for application state"
  [title body]
  (add-watch body :body-watch
             (fn []
               (dom/log "!!!" body)
               ;;(render! title body))))
               (js/setTimeout #(render! title body) 0))))
        

(defn- listen!
  "sets up top level event handlers"
  []
  (event/listen (body-el) :input 
    (fn [ev]
      (let [target (.-target ev)
            id (.getAttribute target "id")
            ev-fn ((keyword id) @!event-map)
            val (.-value target)]
        (when ev-fn (ev-fn val))))
    true))

(defn init!
  [title body]
  (dom-ready!
   (fn []
     (make-watcher! title body)
     (listen!)
     (render! title body))))