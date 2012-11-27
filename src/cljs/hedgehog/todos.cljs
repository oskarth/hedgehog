(ns hedgehog.todos
  (:require
   [clojure.browser.dom :as dom]
   [clojure.browser.event :as event]
   [hedgehog.core :as hedgehog]))

;; inital data state
(def state (atom
            {:todos ["buy milk" "eat lunch" "drink milk"]
             :pending-todo "foo bar"}))

(defn add-todo! [todo]
  (swap! state update-in [:todos] conj todo))

(defn todo-element [todo]
  [:li.todo todo])

(defn todos [state]
  [:div#todos
    [:ul (map todo-element (:todos state))]
    [:input#input
      {:value (:pending-todo state)
       :type "text"}]
   [:button "Add" (comment {:mouse-event add-todo!})]
   [:span (:pending-todo state)]])

;; should init an app, which uses some templates
(hedgehog/init todos state)

(defn input-event [ev]
  (let [val (-> ev .-target .-value)]
    (swap! state assoc :pending-todo val)
    (dom/log @state)))
  
(event/listen (.-body js/document)
              "input"
              input-event)

;; event-map => event/listen
#_{:content [:click foo-fn todos]}