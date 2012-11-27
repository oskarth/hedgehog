(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

(def body (.-body js/document))

(def dom-state (atom {:focus nil}))

(defn render [template new-val]
  (dom/replace-node
    (dom/get-element "content")
    (crate/html
      [:div#content
        (template new-val)])))

(defn init [template state]
  (dom/insert-at
    js/document.body
    (dom/element :div {:id "content"})
    0)
  (add-watch state nil
    (fn [k a old-val new-val]
      (render template new-val)))
  (render template @state))

;; event handlers?
(defn focus-event
  "saves focused dom element in dom-state atom"
  [ev]
  (let [target (-> ev .-target)]
    (swap! dom-state assoc :focus target)
    (dom/log @dom-state)))

(defn blur-event
  "remove previously focused dom element from dom-state atom"
  [ev]
  (swap! dom-state assoc :focus nil)
  (dom/log @dom-state))

(event/listen body :focus focus-event true)
(event/listen body :blur blur-event true)