(ns hedgehog.todos
  (:require
   [clojure.browser.dom :as dom]
   [hedgehog.core :as hedgehog]))

(def todos (atom ["buy milk" "eat lunch" "drink milk"]))

(def pending-todo (atom "foo bar"))

(def notification (atom "test notification"))

(defn first-todo [] (first @todos))

(defn num-todos [] (count @todos))

(defn title-fn []
  (let [num-todos (num-todos)]
    (str "Todos" (when-not (zero? num-todos) (str " (" num-todos ")")))))

(defn add-todo! [todo] (swap! todos conj todo))

(defn update-pending-todo [val]
  (dom/log "update-pending-todo" val)
  (reset! pending-todo val))

(defn todo-element [todo]
  [:li.todo todo
   [:input {:bind-value (fn [] update-pending-todo)}]])

(defn submit-todo []
  (add-todo! @pending-todo)
  (reset! pending-todo "")
  (reset! notification "Nice todo!")
  (js/setTimeout #(reset! notification nil) 5000))

(defn todo-els [] (map todo-element @todos))

(defn notifications []
  (when-let [n @notification] [:div n]))

(defn body-fn []
  [:div#todos
   [:ul (todo-els)]
   [:input
    {:value @pending-todo
     :bind-value (fn [] update-pending-todo)
     :type "text"
     :autofocus false}]
   [:input {:value @pending-todo}]
   [:button "Add"]])

(hedgehog/init! title-fn body-fn)

